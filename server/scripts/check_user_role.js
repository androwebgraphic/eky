import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import connectDB from '../db/connectDB.js';

dotenv.config();

const checkUserRole = async (email) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      process.exit(1);
    }
    
    console.log(`✅ User found:`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  _id: ${user._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node check_user_role.js <email>');
  console.log('Example: node check_user_role.js andreassklizovic@gmail.com');
  process.exit(1);
}

checkUserRole(email);