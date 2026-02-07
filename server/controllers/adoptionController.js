const AdoptionRequest = require('../models/adoptionRequestModel');
const Dog = require('../models/dogModel');
const User = require('../models/userModel');
const ChatConversation = require('../models/chatConversationModel');
const ChatMessage = require('../models/chatMessageModel');

// Create a new adoption request
exports.createAdoptionRequest = async (req, res) => {
  try {
    const { dogId, message } = req.body;
    const adopterId = req.user.id;

    // Check if dog exists
    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Check if user is trying to adopt their own dog
    if (dog.user.toString() === adopterId) {
      return res.status(400).json({ error: 'Cannot adopt your own dog' });
    }

    // Check if there's already a pending or active request for this dog
    const existingRequest = await AdoptionRequest.findOne({
      dog: dogId,
      status: { $in: ['pending', 'owner_confirmed', 'adopter_confirmed'] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'An adoption request is already in progress for this dog' });
    }

    // Create chat conversation for communication
    const conversation = new ChatConversation({
      participants: [dog.user, adopterId]
    });
    await conversation.save();

    // Create initial chat message about adoption request
    await ChatMessage.create({
      conversationId: conversation._id,
      sender: adopterId,
      recipient: dog.user,
      message: `Adoption Request: I am interested in adopting ${dog.name}. ${message || ''}`
    });

    // Update conversation timestamp
    await ChatConversation.findByIdAndUpdate(conversation._id, { updatedAt: Date.now() });

    // Create adoption request
    const adoptionRequest = new AdoptionRequest({
      dog: dogId,
      adopter: adopterId,
      owner: dog.user,
      message,
      conversationId: conversation._id,
      status: 'pending'
    });

    await adoptionRequest.save();

    // Populate and return the request
    await adoptionRequest.populate('dog adopter owner', 'name email');

    res.status(201).json({
      message: 'Adoption request created successfully',
      adoptionRequest
    });
  } catch (error) {
    console.error('Error creating adoption request:', error);
    res.status(500).json({ error: 'Failed to create adoption request' });
  }
};

// Get adoption requests for a user (as owner or adopter)
exports.getUserAdoptionRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = {
      $or: [
        { owner: userId },
        { adopter: userId }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const requests = await AdoptionRequest.find(filter)
      .populate('dog', 'name breed age gender images place')
      .populate('adopter', 'name email')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching adoption requests:', error);
    res.status(500).json({ error: 'Failed to fetch adoption requests' });
  }
};

// Confirm adoption request (owner)
exports.ownerConfirmRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ownerId = req.user.id;

    const request = await AdoptionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    if (request.owner.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not in pending status' });
    }

    request.status = 'owner_confirmed';
    request.timestamps.owner_confirmed_at = new Date();
    await request.save();

    res.json({
      message: 'Adoption request confirmed by owner',
      adoptionRequest: request
    });
  } catch (error) {
    console.error('Error confirming adoption request:', error);
    res.status(500).json({ error: 'Failed to confirm adoption request' });
  }
};

// Confirm adoption request (adopter)
exports.adopterConfirmRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adopterId = req.user.id;

    const request = await AdoptionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    if (request.adopter.toString() !== adopterId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'owner_confirmed') {
      return res.status(400).json({ error: 'Request must be confirmed by owner first' });
    }

    request.status = 'adopter_confirmed';
    request.timestamps.adopter_confirmed_at = new Date();
    await request.save();

    res.json({
      message: 'Adoption request confirmed by adopter',
      adoptionRequest: request
    });
  } catch (error) {
    console.error('Error confirming adoption request:', error);
    res.status(500).json({ error: 'Failed to confirm adoption request' });
  }
};

// Finalize adoption (remove dog from database)
exports.finalizeAdoption = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ownerId = req.user.id;

    const request = await AdoptionRequest.findById(requestId).populate('dog');

    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    if (request.owner.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'adopter_confirmed') {
      return res.status(400).json({ error: 'Request must be confirmed by both parties' });
    }

    // Delete the dog from database
    await Dog.findByIdAndDelete(request.dog._id);

    // Update request status
    request.status = 'adopted';
    request.timestamps.adopted_at = new Date();
    await request.save();

    res.json({
      message: 'Dog adopted successfully and removed from database',
      adoptionRequest: request
    });
  } catch (error) {
    console.error('Error finalizing adoption:', error);
    res.status(500).json({ error: 'Failed to finalize adoption' });
  }
};

// Deny adoption request
exports.denyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ownerId = req.user.id;

    const request = await AdoptionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    if (request.owner.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.status = 'denied';
    request.timestamps.denied_at = new Date();
    await request.save();

    res.json({
      message: 'Adoption request denied',
      adoptionRequest: request
    });
  } catch (error) {
    console.error('Error denying adoption request:', error);
    res.status(500).json({ error: 'Failed to deny adoption request' });
  }
};

// Cancel adoption request (adopter)
exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adopterId = req.user.id;

    const request = await AdoptionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    if (request.adopter.toString() !== adopterId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.status = 'cancelled';
    request.timestamps.cancelled_at = new Date();
    await request.save();

    res.json({
      message: 'Adoption request cancelled',
      adoptionRequest: request
    });
  } catch (error) {
    console.error('Error cancelling adoption request:', error);
    res.status(500).json({ error: 'Failed to cancel adoption request' });
  }
};

// Get a single adoption request
exports.getAdoptionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await AdoptionRequest.findById(requestId)
      .populate('dog', 'name breed age gender images place')
      .populate('adopter', 'name email')
      .populate('owner', 'name email');

    if (!request) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    res.json({ adoptionRequest: request });
  } catch (error) {
    console.error('Error fetching adoption request:', error);
    res.status(500).json({ error: 'Failed to fetch adoption request' });
  }
};