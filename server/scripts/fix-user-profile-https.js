const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const User = require('../models/userModel');

async function fixUserProfileUrls() {
  try {
    console.log('🔍 Searching for users with HTTP profile picture URLs...');
    
    // Find users with HTTP Cloudinary URLs (catches res.cloudinary.com and cloudinary.com)
    const users = await User.find({
      profilePicture: { $regex: '^http://.*cloudinary\\.com' }
    });
    
    console.log(`Found ${users.length} users with HTTP profile picture URLs`);
    
    if (users.length === 0) {
      console.log('✅ No users need fixing');
      process.exit(0);
    }
    
    let updated = 0;
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.username || user.email || user._id}`);
      console.log(`  Old URL: ${user.profilePicture}`);
      
      // Replace http:// with https://
      const newUrl = user.profilePicture.replace('http://', 'https://');
      
      user.profilePicture = newUrl;
      await user.save();
      
      console.log(`  New URL: ${newUrl}`);
      console.log('  ✅ Updated');
      updated++;
    }
    
    console.log(`\n✅ Successfully updated ${updated} user profile picture URLs to HTTPS`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserProfileUrls();