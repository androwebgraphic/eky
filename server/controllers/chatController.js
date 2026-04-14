
const ChatMessage = require('../models/chatMessageModel');
const ChatConversation = require('../models/chatConversationModel');
const User = require('../models/userModel');
const { io } = require('../socket');
const mongoose = require('mongoose');
const { checkMessage: checkWordFilter } = require('../utils/wordFilter');

const deleteChatHistory = async (req, res) => {
  const { conversationId } = req.params;
  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
  
  // Delete all messages in the conversation
  await ChatMessage.deleteMany({ conversationId });
  
  // Also delete the conversation document itself
  await ChatConversation.deleteOne({ _id: conversationId });
  
  console.log(`[DELETE] Conversation ${conversationId} deleted completely`);
  res.json({ success: true });
};

const blockUser = async (req, res) => {
  const { userId, blockId } = req.body;
  if (!userId || !blockId) return res.status(400).json({ error: 'Missing userId or blockId' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.blockedUsers.includes(blockId)) {
    user.blockedUsers.push(blockId);
    await user.save();
  }
  res.json({ success: true });
};

const unblockUser = async (req, res) => {
  const { userId, blockId } = req.body;
  if (!userId || !blockId) return res.status(400).json({ error: 'Missing userId or blockId' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== blockId);
  await user.save();
  res.json({ success: true });
};

const getOrCreateConversation = async (req, res) => {
  let { userId, otherUserId } = req.body;
  if (!userId || !otherUserId) return res.status(400).json({ error: 'Missing user IDs' });
  // Ensure both are strings (ObjectId hex) and not objects
  if (typeof userId === 'object' && userId._id) userId = userId._id;
  if (typeof otherUserId === 'object' && otherUserId._id) otherUserId = otherUserId._id;
  // Ensure both are ObjectId
  try {
    userId = new mongoose.Types.ObjectId(userId);
    otherUserId = new mongoose.Types.ObjectId(otherUserId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  let convo = await ChatConversation.findOne({ participants: { $all: [userId, otherUserId] } });
  if (!convo) {
    convo = await ChatConversation.create({ participants: [userId, otherUserId] });
  }
  res.json(convo);
};

const sendMessage = async (req, res) => {
  const { conversationId, sender, recipient, message, language } = req.body;
  if (!conversationId || !sender || !recipient || !message) return res.status(400).json({ error: 'Missing fields' });
  
  try {
    // Get sender user to check suspension/deletion status
    const senderUser = await User.findById(sender);
    if (!senderUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is deleted
    if (senderUser.isDeleted) {
      return res.status(403).json({ error: 'Account deleted' });
    }
    
    // Check if user is suspended
    if (senderUser.suspendedUntil && senderUser.suspendedUntil > new Date()) {
      const suspensionEndDate = new Date(senderUser.suspendedUntil);
      return res.status(403).json({ 
        error: 'Account suspended',
        suspendedUntil: suspensionEndDate,
        message: 'Your account is suspended. You cannot send messages until ' + suspensionEndDate.toISOString()
      });
    }
    
    // Check message against word filter
    const filterResult = checkWordFilter(message, language || 'en');
    
    if (filterResult.isProhibited) {
      console.log(`Word filter violation by user ${sender}: matched word "${filterResult.matchedWord}"`);
      
      // Increment violation count
      senderUser.violationCount = (senderUser.violationCount || 0) + 1;
      senderUser.lastViolationDate = new Date();
      
      let warningMessage = '';
      let messageType = 'system_warning';
      
      // Handle based on violation count
      if (senderUser.violationCount === 1) {
        // First violation - just warn
        warningMessage = getWarningMessage('first', language || 'en');
        console.log(`First violation for user ${sender}, sending warning`);
      } else {
        // Second violation or more - suspend for 30 days or delete account
        if (senderUser.violationCount === 2) {
          // Second violation - suspend for 30 days
          const suspensionDate = new Date();
          suspensionDate.setDate(suspensionDate.getDate() + 30);
          senderUser.suspendedUntil = suspensionDate;
          warningMessage = getWarningMessage('suspended', language || 'en', suspensionDate);
          console.log(`Second violation for user ${sender}, suspending until ${suspensionDate}`);
          messageType = 'system_warning';
        } else if (senderUser.violationCount >= 3) {
          // Third+ violation - delete account
          senderUser.isDeleted = true;
          warningMessage = getWarningMessage('deleted', language || 'en');
          console.log(`Third+ violation for user ${sender}, deleting account`);
          messageType = 'system_warning';
        }
      }
      
      await senderUser.save();
      
      // Send system warning message to the conversation
      const warningMsg = await ChatMessage.create({
        conversationId,
        sender: null,
        recipient: sender,
        message: warningMessage,
        messageType: messageType,
        sentAt: new Date()
      });
      
      await ChatConversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
      
      // Emit warning to sender if io is available
      if (io && typeof io.to === 'function') {
        io.to(sender).emit('receiveMessage', { 
          conversationId, 
          sender: null, 
          message: warningMessage, 
          sentAt: warningMsg.sentAt,
          messageType: messageType
        });
      }
      
      // Return error to client with warning details
      return res.status(403).json({ 
        error: 'Message blocked',
        reason: 'Contains prohibited words',
        warning: warningMessage,
        violationCount: senderUser.violationCount,
        isSuspended: !!senderUser.suspendedUntil,
        isDeleted: senderUser.isDeleted
      });
    }
    
    // Message is safe - send it
    const msg = await ChatMessage.create({ conversationId, sender, recipient, message });
    await ChatConversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
    
    // Emit to both sender and recipient if io is available
    if (io && typeof io.to === 'function') {
      console.log('[SERVER] Emitting message to both sender and recipient');
      console.log('[SERVER] conversationId:', conversationId);
      console.log('[SERVER] sender:', sender);
      console.log('[SERVER] recipient:', recipient);
      console.log('[SERVER] message:', message);
      
      // Check if rooms exist and have members
      const senderRoom = io.sockets.adapter.rooms.get(String(sender));
      const recipientRoom = io.sockets.adapter.rooms.get(String(recipient));
      
      console.log('[SERVER] Sender room members:', senderRoom ? Array.from(senderRoom).length : 0);
      console.log('[SERVER] Recipient room members:', recipientRoom ? Array.from(recipientRoom).length : 0);
      
      // Create complete message object for socket emission
      const socketMessage = {
        _id: msg._id,
        conversationId: conversationId,
        sender: sender,
        recipient: recipient,
        message: message,
        sentAt: msg.sentAt,
        messageType: 'text'
      };
      
      // Emit to recipient
      console.log('[SERVER] Emitting to recipient room:', String(recipient));
      io.to(recipient).emit('receiveMessage', socketMessage);
      
      // Also emit to sender so they get confirmation via socket
      console.log('[SERVER] Emitting to sender room:', String(sender));
      io.to(sender).emit('receiveMessage', socketMessage);
      
      console.log('[SERVER] Message emitted successfully');
    } else {
      console.log('[SERVER] io is not available or io.to is not a function');
    }
    
    res.json(msg);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Get warning message based on violation type and language
 * @param {string} type - 'first', 'suspended', or 'deleted'
 * @param {string} language - Language code
 * @param {Date} suspensionDate - Suspension end date (for suspended type)
 * @returns {string} - Warning message
 */
function getWarningMessage(type, language, suspensionDate) {
  const messages = {
    en: {
      first: '⚠️ WARNING: Your message was deleted. Attempting to sell, trade, or exchange dogs is strictly prohibited. Your account will be suspended for 30 days if you continue to violate our terms.',
      suspended: `⛔ ACCOUNT SUSPENDED: Your account has been suspended for 30 days due to repeated violations. You cannot send messages until ${suspensionDate ? suspensionDate.toLocaleDateString() : 'the suspension period ends'}.`,
      deleted: '🚫 ACCOUNT DELETED: Your account has been permanently deleted due to repeated violations of our terms of use. You can no longer use this service.'
    },
    hr: {
      first: '⚠️ UPOZORENJE: Vaša poruka je obrisana. Pokušaj prodaje, razmjene ili zamjena pasa strogo je zabranjen. Vaš račun bit će suspendiran 30 dana ako nastavite kršiti naše uvjete.',
      suspended: `⛔ SUSPENDIRAN RAČUN: Vaš račun je suspendiran na 30 dana zbog ponavljanja prekršaja. Ne možete slati poruke do ${suspensionDate ? suspensionDate.toLocaleDateString('hr-HR') : 'isteka perioda suspenzije'}.`,
      deleted: '🚫 IZBRISAN RAČUN: Vaš račun je trajno izbrisan zbog ponavljanja kršenja naših uvjeta korištenja. Više ne možete koristiti ovu uslugu.'
    },
    de: {
      first: '⚠️ WARNUNG: Ihre Nachricht wurde gelöscht. Der Versuch, Hunde zu verkaufen, zu tauschen oder auszutauschen, ist strengstens verboten. Ihr Konto wird für 30 Tage gesperrt, wenn Sie unsere Bedingungen weiterhin verletzen.',
      suspended: `⛔ KONTOSPERRUNG: Ihr Konto wurde aufgrund wiederholter Verstöße für 30 Tage gesperrt. Sie können keine Nachrichten senden, bis ${suspensionDate ? suspensionDate.toLocaleDateString('de-DE') : 'die Sperrfrist endt'}.`,
      deleted: '🚫 KONTO GELÖSCHT: Ihr Konto wurde aufgrund wiederholter Verstöße gegen unsere Nutzungsbedingungen dauerhaft gelöscht. Sie diesen Dienst nicht mehr nutzen können.'
    },
    hu: {
      first: '⚠️ FIGYELMEZTETÉS: Üzenete törölve lett. Kutyák eladásának, cseréjének vagy cserejének kísérlete szigorúan tilos. Fiókja 30 napra felfüggesztésre kerül, ha továbbra is megszegi feltételeinket.',
      suspended: `⛔ FELFÜGGESZTETT FIÓK: Fiókja a szabályok ismételt megsértése miatt 30 napra felfüggesztésre került. Nem küldhet üzeneteket ${suspensionDate ? suspensionDate.toLocaleDateString('hu-HU') : 'a felfüggesztési időszak végéig'}.`,
      deleted: '🚂 TÖRÖLT FIÓK: Fiókja a használati feltételek ismételt megsértése miatt véglegesen törlésre került. Továbbá nem használhatja ezt a szolgáltatást.'
    }
  };
  
  const langMessages = messages[language] || messages.en;
  return langMessages[type] || langMessages.first;
}

const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
  const messages = await ChatMessage.find({ conversationId }).sort({ sentAt: 1 });
  res.json(messages);
};

const getUserConversations = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  
  const convos = await ChatConversation.find({ participants: userId }).sort({ updatedAt: -1 });
  
  // Add unread count and last message for each conversation
  const convosWithDetails = await Promise.all(convos.map(async (convo) => {
    const unreadCount = await ChatMessage.countDocuments({
      conversationId: convo._id,
      recipient: userId,
      readAt: { $exists: false }
    });
    
    // Get last message for preview
    const lastMessage = await ChatMessage.findOne({ conversationId: convo._id })
      .sort({ sentAt: -1 })
      .select('message sentAt');
    
    return {
      ...convo.toObject(),
      unreadCount,
      lastMessage: lastMessage ? lastMessage.message : ''
    };
  }));
  
  res.json(convosWithDetails);
};

// Get unread message count for a user
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const unreadCount = await ChatMessage.countDocuments({
      recipient: userId,
      readAt: { $exists: false }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Mark messages as read for a conversation
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId } = req.body;
    
    if (!userId || !conversationId) {
      return res.status(400).json({ error: 'Missing userId or conversationId' });
    }

    const result = await ChatMessage.updateMany(
      {
        conversationId,
        recipient: userId,
        readAt: { $exists: false }
      },
      { readAt: new Date() }
    );

    res.json({ success: true, markedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

module.exports = {
  deleteChatHistory,
  blockUser,
  unblockUser,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  getUnreadCount,
  markMessagesAsRead
};
