const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const fixUserPaths = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users with /uploads/ in profilePicture
    const users = await User.find({ 
      profilePicture: { $regex: '^/uploads/users/' }
    });

    console.log(`Found ${users.length} users with old profile picture paths`);

    for (const user of users) {
      console.log(`Processing user: ${user.username}`);
      console.log(`  Old path: ${user.profilePicture}`);
      
      // Replace /uploads/users/ with /u/users/
      const newPath = user.profilePicture.replace('/uploads/users/', '/u/users/');
      console.log(`  New path: ${newPath}`);
      
      // Update user
      user.profilePicture = newPath;
      await user.save();
      
      console.log(`  Updated successfully`);
    }

    console.log('All user profile picture paths fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUserPaths();