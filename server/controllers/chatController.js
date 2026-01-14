// Delete all messages in a conversation
export async function deleteChatHistory(req, res) {
  const { conversationId } = req.params;
  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
  await ChatMessage.deleteMany({ conversationId });
  res.json({ success: true });
}

// Block a user
export async function blockUser(req, res) {
  const { userId, blockId } = req.body;
  if (!userId || !blockId) return res.status(400).json({ error: 'Missing userId or blockId' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.blockedUsers.includes(blockId)) {
    user.blockedUsers.push(blockId);
    await user.save();
  }
  res.json({ success: true });
}

// Unblock a user
export async function unblockUser(req, res) {
  const { userId, blockId } = req.body;
  if (!userId || !blockId) return res.status(400).json({ error: 'Missing userId or blockId' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== blockId);
  await user.save();
  res.json({ success: true });
}
import ChatMessage from '../models/chatMessageModel.js';
import ChatConversation from '../models/chatConversationModel.js';
import User from '../models/userModel.js';

// Create or get a conversation between two users
export async function getOrCreateConversation(req, res) {
  const { userId, otherUserId } = req.body;
  if (!userId || !otherUserId) return res.status(400).json({ error: 'Missing user IDs' });
  let convo = await ChatConversation.findOne({ participants: { $all: [userId, otherUserId] } });
  if (!convo) {
    convo = await ChatConversation.create({ participants: [userId, otherUserId] });
  }
  res.json(convo);
}

// Send a message
export async function sendMessage(req, res) {
  const { conversationId, sender, recipient, message } = req.body;
  if (!conversationId || !sender || !recipient || !message) return res.status(400).json({ error: 'Missing fields' });
  const msg = await ChatMessage.create({ conversationId, sender, recipient, message });
  await ChatConversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
  res.json(msg);
}

// Get messages for a conversation
export async function getMessages(req, res) {
  const { conversationId } = req.params;
  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
  const messages = await ChatMessage.find({ conversationId }).sort({ sentAt: 1 });
  res.json(messages);
}

// Get all conversations for a user
export async function getUserConversations(req, res) {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const convos = await ChatConversation.find({ participants: userId }).sort({ updatedAt: -1 });
  res.json(convos);
}
