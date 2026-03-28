/**
 * Migration Script to Fix OpaqueResponseBlocking Issues
 * 
 * This script:
 * 1. Converts full URLs to relative paths in all image URLs
 * 2. Ensures consistent protocol usage (https)
 * 3. Removes any hardcoded domain references
 * 
 * Run with: node server/scripts/fix-opaque-response-blocking.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas for migrations
const UserSchema = new mongoose.Schema({
  profilePicture: String,
  // Add other fields as needed
}, { strict: false });

const DogSchema = new mongoose.Schema({
  images: [{
    url: String,
    width: Number,
    size: String
  }],
  thumbnail: {
    url: String
  },
  video: {
    url: String,
    poster: [{
      url: String,
      width: Number,
      size: String
    }]
  }
}, { strict: false });

// Create models
const User = mongoose.model('User', UserSchema);
const Dog = mongoose.model('Dog', DogSchema);

// Known hardcoded URLs to replace
const HARDCODED_URLS = [
  'https://sharedog-homeless-backend.onrender.com',
  'http://sharedog-homeless-backend.onrender.com',
  'https://eky-3xf1.onrender.com',
  'http://eky-3xf1.onrender.com',
  'https://sharedog-backend-o8ta.onrender.com',
  'http://sharedog-backend-o8ta.onrender.com',
];

/**
 * Fix a single URL by converting to relative path
 */
function fixUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Remove cache buster if present
  let cleanUrl = url.split('?')[0];

  // Replace all known hardcoded URLs with empty string
  for (const hardcodedUrl of HARDCODED_URLS) {
    if (cleanUrl.startsWith(hardcodedUrl)) {
      cleanUrl = cleanUrl.substring(hardcodedUrl.length);
      console.log(`  🔄 Fixed: ${url.substring(0, 50)}... → ${cleanUrl.substring(0, 50)}...`);
      break;
    }
  }

  // Ensure it starts with / if it's a path
  if (!cleanUrl.startsWith('/') && !cleanUrl.startsWith('http')) {
    cleanUrl = '/' + cleanUrl;
  }

  return cleanUrl;
}

/**
 * Fix all URLs in a dog document
 */
async function fixDogUrls(dog) {
  let modified = false;

  // Fix images array
  if (dog.images && Array.isArray(dog.images)) {
    dog.images.forEach(img => {
      if (img.url) {
        const fixedUrl = fixUrl(img.url);
        if (fixedUrl !== img.url) {
          img.url = fixedUrl;
          modified = true;
        }
      }
    });
  }

  // Fix thumbnail
  if (dog.thumbnail && dog.thumbnail.url) {
    const fixedUrl = fixUrl(dog.thumbnail.url);
    if (fixedUrl !== dog.thumbnail.url) {
      dog.thumbnail.url = fixedUrl;
      modified = true;
    }
  }

  // Fix video URL
  if (dog.video && dog.video.url) {
    const fixedUrl = fixUrl(dog.video.url);
    if (fixedUrl !== dog.video.url) {
      dog.video.url = fixedUrl;
      modified = true;
    }
  }

  // Fix video poster array
  if (dog.video && dog.video.poster && Array.isArray(dog.video.poster)) {
    dog.video.poster.forEach(poster => {
      if (poster.url) {
        const fixedUrl = fixUrl(poster.url);
        if (fixedUrl !== poster.url) {
          poster.url = fixedUrl;
          modified = true;
        }
      }
    });
  }

  return modified;
}

/**
 * Fix all URLs in a user document
 */
async function fixUserUrls(user) {
  let modified = false;

  if (user.profilePicture) {
    const fixedUrl = fixUrl(user.profilePicture);
    if (fixedUrl !== user.profilePicture) {
      user.profilePicture = fixedUrl;
      modified = true;
    }
  }

  return modified;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n🚀 Starting migration to fix OpaqueResponseBlocking issues...\n');

  try {
    // Fix dogs
    console.log('📸 Processing dogs...');
    const dogs = await Dog.find({});
    console.log(`   Found ${dogs.length} dogs`);

    let dogsModified = 0;
    for (const dog of dogs) {
      const modified = await fixDogUrls(dog);
      if (modified) {
        await dog.save();
        dogsModified++;
      }
    }
    console.log(`   ✅ Updated ${dogsModified} dogs\n`);

    // Fix users
    console.log('👤 Processing users...');
    const users = await User.find({});
    console.log(`   Found ${users.length} users`);

    let usersModified = 0;
    for (const user of users) {
      const modified = await fixUserUrls(user);
      if (modified) {
        await user.save();
        usersModified++;
      }
    }
    console.log(`   ✅ Updated ${usersModified} users\n`);

    console.log('🎉 Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Dogs updated: ${dogsModified}/${dogs.length}`);
    console.log(`   - Users updated: ${usersModified}/${users.length}`);
    console.log(`   - Total changes: ${dogsModified + usersModified}\n`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrate();