import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import connectDB from '../db/connectDB.js';

dotenv.config();

const makeSuperAdmin = async (email) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      process.exit(1);
    }
    
    // Update role directly without validation
    await User.updateOne(
      { email: email },
      { $set: { role: 'superadmin' } }
    );
    
    const updatedUser = await User.findOne({ email: email });
    
    console.log(`✅ Successfully made ${email} a superadmin!`);
    console.log(`User details:`);
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  Username: ${updatedUser.username}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role: ${updatedUser.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line argument or use default
const email = process.argv[2] || 'andreassklizovic@gmail.com';

makeSuperAdmin(email);
