import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userId = '69620fe501ef6914844750d0';
    const user = await User.findById(userId);
    
    if (user) {
      console.log(`\n✅ User exists: ${user.name} (${user._id})`);
    } else {
      console.log(`\n❌ User ${userId} does NOT exist in database`);
      console.log('This means dogs referencing this user will have null user after populate');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
