const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
  dog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dog',
    required: true
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'owner_confirmed', 'adopter_confirmed', 'adopted', 'denied', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  // Chat conversation ID for communication
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatConversation'
  },
  timestamps: {
    owner_confirmed_at: Date,
    adopter_confirmed_at: Date,
    adopted_at: Date,
    denied_at: Date,
    cancelled_at: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
adoptionRequestSchema.index({ dog: 1, adopter: 1 });
adoptionRequestSchema.index({ status: 1 });
adoptionRequestSchema.index({ owner: 1, status: 1 });
adoptionRequestSchema.index({ adopter: 1, status: 1 });

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);