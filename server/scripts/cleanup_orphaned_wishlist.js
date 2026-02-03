// cleanup_orphaned_wishlist.js
// Removes non-existent dog IDs from all users' wishlists

const mongoose = require('mongoose');
const User = require('../models/userModel');
const Dog = require('../models/dogModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';

async function cleanupWishlists() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const allDogIds = new Set((await Dog.find({}, '_id')).map(d => String(d._id)));
  const users = await User.find({});
  let totalFixed = 0;

  for (const user of users) {
    if (user.wishlist && user.wishlist.length > 0) {
      const original = user.wishlist.map(String);
      const filtered = original.filter(dogId => allDogIds.has(dogId));
      if (filtered.length !== original.length) {
        user.wishlist = filtered;
        await user.save();
        console.log(`Fixed wishlist for user ${user.username || user.email}: ${original.length} -> ${filtered.length}`);
        totalFixed++;
      }
    }
  }

  console.log(`Cleanup complete. Users fixed: ${totalFixed}`);
  await mongoose.disconnect();
}

cleanupWishlists().catch(err => {
  console.error('Error during wishlist cleanup:', err);
  process.exit(1);
});
