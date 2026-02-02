
const express = require('express');
const { getOrCreateConversation, sendMessage, getMessages, getUserConversations, deleteChatHistory, blockUser, unblockUser } = require('../controllers/chatController.js');
const { getUserById } = require('../controllers/userController.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Delete all messages in a conversation
router.delete('/messages/:conversationId', auth, deleteChatHistory);

// Block/unblock user
router.post('/block', auth, blockUser);
router.post('/unblock', auth, unblockUser);

// Get user by ID
router.get('/users/:id', auth, getUserById);

// Get or create a conversation between two users
router.post('/conversation', auth, getOrCreateConversation);

// Send a message
router.post('/message', auth, sendMessage);

// Get messages for a conversation
router.get('/messages/:conversationId', auth, getMessages);

// Get all conversations for a user
router.get('/conversations/:userId', auth, getUserConversations);

module.exports = router;
