const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  // Make sender and recipient optional to allow system messages
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  // Track when message was read by recipient
  readAt: { type: Date },
  // Special message types for adoption flow and system messages
  messageType: { type: String, enum: ['text', 'adoption_request', 'adoption_confirmed', 'adoption_denied', 'adoption_cancelled', 'adoption_completed', 'system_warning'], default: 'text' },
  dogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dog' },
  // For tracking who can take action on this message
  requiresAction: { type: Boolean, default: false },
  actionTakenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);