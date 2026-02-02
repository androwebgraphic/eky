
const ChatMessage = require('../models/chatMessageModel');
const ChatConversation = require('../models/chatConversationModel');
const User = require('../models/userModel');
const { io } = require('../socket');
const mongoose = require('mongoose');

const deleteChatHistory = async (req, res) => {
  const { conversationId } = req.params;
  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
  await ChatMessage.deleteMany({ conversationId });
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
  const { conversationId, sender, recipient, message } = req.body;
  if (!conversationId || !sender || !recipient || !message) return res.status(400).json({ error: 'Missing fields' });
  const msg = await ChatMessage.create({ conversationId, sender, recipient, message });
  await ChatConversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
  // Emit to recipient if io is available
  if (io && typeof io.to === 'function') {
    io.to(recipient).emit('receiveMessage', { conversationId, sender, message, sentAt: msg.sentAt });
  }
  res.json(msg);
};

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
  res.json(convos);
};

module.exports = {
  deleteChatHistory,
  blockUser,
  unblockUser,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  getUserConversations
};
