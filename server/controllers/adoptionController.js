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

    // Check if conversation already exists between these users
    let conversation = await ChatConversation.findOne({
      participants: { $all: [dog.user, adopterId], $size: 2 }
    });

    if (!conversation) {
      conversation = new ChatConversation({
        participants: [dog.user, adopterId]
      });
      await conversation.save();
    }

    // Create adoption request message in chat
    await ChatMessage.create({
      conversationId: conversation._id,
      sender: adopterId,
      recipient: dog.user,
      message: `Adoption Request: I am interested in adopting ${dog.name}. ${message || ''}`,
      messageType: 'adoption_request',
      dogId: dogId,
      requiresAction: true
    });

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

    // Update Dog model to reflect adoption status
    await Dog.findByIdAndUpdate(dogId, {
      adoptionStatus: 'pending',
      adoptionQueue: {
        adopter: adopterId,
        ownerConfirmed: false,
        adopterConfirmed: false
      }
    });

    // Populate and return request
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

    // Update Dog model to reflect owner confirmation
    await Dog.findByIdAndUpdate(request.dog, {
      'adoptionQueue.ownerConfirmed': true
    });

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

    // Update Dog model to reflect adopter confirmation
    await Dog.findByIdAndUpdate(request.dog, {
      adoptionStatus: 'adopted',
      'adoptionQueue.adopterConfirmed': true
    });

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

    // Update Dog model to clear adoption status
    await Dog.findByIdAndUpdate(request.dog, {
      adoptionStatus: 'available',
      $unset: { adoptionQueue: '' }
    });

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

    // Update Dog model to clear adoption status
    await Dog.findByIdAndUpdate(request.dog, {
      adoptionStatus: 'available',
      $unset: { adoptionQueue: '' }
    });

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

// Handle adoption action from chat (owner confirm/deny, adopter confirm/cancel)
exports.handleAdoptionAction = async (req, res) => {
  try {
    const { messageId, action } = req.body;
    const userId = req.user.id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const adoptionRequest = await AdoptionRequest.findOne({
      dog: message.dogId,
      conversationId: message.conversationId
    }).populate('dog');

    if (!adoptionRequest) {
      return res.status(404).json({ error: 'Adoption request not found' });
    }

    const isOwner = userId === adoptionRequest.owner.toString();
    const isAdopter = userId === adoptionRequest.adopter.toString();

    // Owner confirms adoption
    if (action === 'owner_confirm' && isOwner) {
      if (adoptionRequest.status !== 'pending') {
        return res.status(400).json({ error: 'Invalid status for owner confirmation' });
      }

      adoptionRequest.status = 'owner_confirmed';
      adoptionRequest.timestamps.owner_confirmed_at = new Date();
      await adoptionRequest.save();

      await Dog.findByIdAndUpdate(adoptionRequest.dog._id, {
        'adoptionQueue.ownerConfirmed': true
      });

      // Send confirmation message to adopter
      await ChatMessage.create({
        conversationId: message.conversationId,
        sender: userId,
        recipient: adoptionRequest.adopter,
        message: `Owner confirmed adoption request for ${adoptionRequest.dog.name}. Please confirm to proceed.`,
        messageType: 'adoption_confirmed',
        dogId: message.dogId,
        requiresAction: true
      });

      // Mark original message as action taken
      message.requiresAction = false;
      message.actionTakenBy = userId;
      await message.save();

      res.json({ message: 'Adoption confirmed by owner', adoptionRequest });
    }
    // Owner denies adoption
    else if (action === 'owner_deny' && isOwner) {
      if (adoptionRequest.status !== 'pending' && adoptionRequest.status !== 'owner_confirmed') {
        return res.status(400).json({ error: 'Invalid status for denial' });
      }

      adoptionRequest.status = 'denied';
      adoptionRequest.timestamps.denied_at = new Date();
      await adoptionRequest.save();

      await Dog.findByIdAndUpdate(adoptionRequest.dog._id, {
        adoptionStatus: 'available',
        $unset: { adoptionQueue: '' }
      });

      // Send denial message to adopter
      await ChatMessage.create({
        conversationId: message.conversationId,
        sender: userId,
        recipient: adoptionRequest.adopter,
        message: `Owner denied adoption request for ${adoptionRequest.dog.name}.`,
        messageType: 'adoption_denied',
        dogId: message.dogId
      });

      // Mark original message as action taken
      message.requiresAction = false;
      message.actionTakenBy = userId;
      await message.save();

      res.json({ message: 'Adoption denied', adoptionRequest });
    }
    // Adopter confirms adoption (after owner confirmation)
    else if (action === 'adopter_confirm' && isAdopter) {
      if (adoptionRequest.status !== 'owner_confirmed') {
        return res.status(400).json({ error: 'Owner must confirm first' });
      }

      adoptionRequest.status = 'adopter_confirmed';
      adoptionRequest.timestamps.adopter_confirmed_at = new Date();
      await adoptionRequest.save();

      await Dog.findByIdAndUpdate(adoptionRequest.dog._id, {
        adoptionStatus: 'adopted',
        'adoptionQueue.adopterConfirmed': true
      });

      // Delete the dog from database (both parties confirmed)
      await Dog.findByIdAndDelete(adoptionRequest.dog._id);

      // Send completion message to owner
      await ChatMessage.create({
        conversationId: message.conversationId,
        sender: userId,
        recipient: adoptionRequest.owner,
        message: `Adoption completed! Both parties confirmed. ${adoptionRequest.dog.name} is now adopted and removed from the list.`,
        messageType: 'adoption_completed',
        dogId: message.dogId
      });

      // Mark original message as action taken
      message.requiresAction = false;
      message.actionTakenBy = userId;
      await message.save();

      res.json({ message: 'Adoption confirmed by adopter', adoptionRequest });
    }
    // Adopter cancels adoption
    else if (action === 'adopter_cancel' && isAdopter) {
      if (adoptionRequest.status !== 'pending' && adoptionRequest.status !== 'owner_confirmed') {
        return res.status(400).json({ error: 'Cannot cancel at this stage' });
      }

      adoptionRequest.status = 'cancelled';
      adoptionRequest.timestamps.cancelled_at = new Date();
      await adoptionRequest.save();

      await Dog.findByIdAndUpdate(adoptionRequest.dog._id, {
        adoptionStatus: 'available',
        $unset: { adoptionQueue: '' }
      });

      // Send cancellation message to owner
      await ChatMessage.create({
        conversationId: message.conversationId,
        sender: userId,
        recipient: adoptionRequest.owner,
        message: `Adopter cancelled adoption request for ${adoptionRequest.dog.name}.`,
        messageType: 'adoption_cancelled',
        dogId: message.dogId
      });

      // Mark original message as action taken
      message.requiresAction = false;
      message.actionTakenBy = userId;
      await message.save();

      res.json({ message: 'Adoption cancelled', adoptionRequest });
    }
    else {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }
  } catch (error) {
    console.error('Error handling adoption action:', error);
    res.status(500).json({ error: 'Failed to handle adoption action' });
  }
};
