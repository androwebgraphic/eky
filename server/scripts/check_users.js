const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).select('username email role profilePicture');
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role || 'user'}`);
      console.log(`  Profile Picture: ${user.profilePicture}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();