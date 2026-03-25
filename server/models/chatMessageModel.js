const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  // Special message types for adoption flow
  messageType: { type: String, enum: ['text', 'adoption_request', 'adoption_confirmed', 'adoption_denied', 'adoption_cancelled', 'adoption_completed'], default: 'text' },
  dogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dog' },
  // For tracking who can take action on this message
  requiresAction: { type: Boolean, default: false },
  actionTakenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);