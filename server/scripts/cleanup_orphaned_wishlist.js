const mongoose = require('mongoose');
const User = require('../models/userModel');
const Dog = require('../models/dogModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    // Find all users
    const users = await User.find({});
    
    for (const user of users) {
      if (!user.wishlist || user.wishlist.length === 0) continue;
      
      console.log(`\n=== User: ${user.username} ===`);
      console.log(`Wishlist size: ${user.wishlist.length}`);
      
      // Check which dogs actually exist
      const validDogs = await Dog.find({ _id: { $in: user.wishlist } }).select('_id');
      const validDogIds = validDogs.map(d => d._id.toString());
      
      console.log(`Valid dogs: ${validDogIds.length}`);
      
      // Find orphaned IDs (in wishlist but not in validDogs)
      const orphanedIds = user.wishlist.filter(id => !validDogIds.includes(id.toString()));
      
      if (orphanedIds.length > 0) {
        console.log(`Found ${orphanedIds.length} orphaned IDs`);
        console.log('Removing orphaned IDs from wishlist...');
        
        // Update user to remove orphaned IDs
        await User.findByIdAndUpdate(
          user._id,
          { $pull: { wishlist: { $in: orphanedIds } } }
        );
        
        console.log('✓ Cleaned up wishlist');
      } else {
        console.log('✓ Wishlist is clean (no orphans)');
      }
    }
    
    console.log('\n=== SUMMARY ===');
    const updatedUsers = await User.find({});
    let totalOrphans = 0;
    for (const user of updatedUsers) {
      const validDogs = await Dog.find({ _id: { $in: user.wishlist } });
      const orphanedCount = user.wishlist.length - validDogs.length;
      totalOrphans += orphanedCount;
    }
    
    if (totalOrphans === 0) {
      console.log('✓ All wishlists are now clean!');
    } else {
      console.log(`⚠️  Still found ${totalOrphans} orphaned entries`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });