import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const Dog = mongoose.model('Dog', new mongoose.Schema({
  user: String,
  name: String,
  adoptionStatus: String,
  adoptionQueue: {
    adopter: String,
    ownerConfirmed: Boolean,
    adopterConfirmed: Boolean
  }
}));

const ChatConversation = mongoose.model('ChatConversation', new mongoose.Schema({
  participants: [String],
  updatedAt: Date
}));

const ChatMessage = mongoose.model('ChatMessage', new mongoose.Schema({
  conversationId: String,
  sender: String,
  recipient: String,
  message: String,
  sentAt: Date
}));

// Find all pending dogs
const pendingDogs = await Dog.find({ adoptionStatus: 'pending', 'adoptionQueue.adopter': { $exists: true } });

console.log('Found', pendingDogs.length, 'pending adoptions');

for (const dog of pendingDogs) {
  const ownerId = dog.user.toString();
  const adopterId = dog.adoptionQueue.adopter.toString();

  // Check if conversation exists
  let convo = await ChatConversation.findOne({ participants: { $all: [adopterId, ownerId] } });

  if (!convo) {
    console.log('Creating conversation for dog', dog._id, 'between', adopterId, 'and', ownerId);
    convo = await ChatConversation.create({ participants: [adopterId, ownerId] });

    // Send adoption request message
    const messageText = `I would like to adopt your dog ${dog.name}. Please confirm the adoption.`;
    const msg = await ChatMessage.create({
      conversationId: convo._id,
      sender: adopterId,
      recipient: ownerId,
      message: messageText
    });
    await ChatConversation.findByIdAndUpdate(convo._id, { updatedAt: Date.now() });

    console.log('Created conversation and message');
  } else {
    console.log('Conversation already exists for dog', dog._id);
  }
}

console.log('Done');
process.exit(0);