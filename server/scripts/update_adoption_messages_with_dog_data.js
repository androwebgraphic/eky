const mongoose = require('mongoose');
const Dog = require('../models/dogModel');
const ChatMessage = require('../models/chatMessageModel');
require('dotenv').config({ path: __dirname + '/../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const updateAdoptionMessages = async () => {
  try {
    await connectDB();

    // Find all adoption request messages that don't have dogData
    const messages = await ChatMessage.find({
      messageType: 'adoption_request',
      dogData: { $exists: false }
    });

    console.log(`Found ${messages.length} adoption request messages without dog data`);

    for (const msg of messages) {
      if (!msg.dogId) {
        console.log(`Message ${msg._id} has no dogId, skipping...`);
        continue;
      }

      // Fetch dog data
      const dog = await Dog.findById(msg.dogId);
      if (!dog) {
        console.log(`Dog ${msg.dogId} not found for message ${msg._id}, skipping...`);
        continue;
      }

      // Update message with dog data
      msg.dogData = {
        _id: dog._id,
        name: dog.name,
        breed: dog.breed,
        age: dog.age,
        size: dog.size,
        gender: dog.gender,
        location: dog.location || dog.place,
        thumbnail: dog.thumbnail,
        images: dog.images
      };

      await msg.save();
      console.log(`✓ Updated message ${msg._id} with dog data for "${dog.name}"`);
    }

    console.log('\n✅ All adoption request messages updated with dog data!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

updateAdoptionMessages();