const mongoose = require('mongoose');
const User = require('../models/userModel');
const Dog = require('../models/dogModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find Andreas user
    const user = await User.findOne({ username: 'andreas' });
    console.log('\n=== ANDREAS WISHLIST ===');
    console.log('Wishlist IDs:', user.wishlist);
    console.log('Wishlist count:', user.wishlist.length);
    
    // Find dogs in wishlist
    const dogs = await Dog.find({ _id: { $in: user.wishlist } }).select('_id name');
    console.log('\nDogs in wishlist:');
    dogs.forEach(d => console.log(`  ${d._id}: ${d.name}`));
    console.log(`Total dogs found: ${dogs.length}`);
    
    console.log('\n=== COMPARISON ===');
    console.log(`User.wishlist array length: ${user.wishlist.length}`);
    console.log(`Dogs actually found: ${dogs.length}`);
    
    if (user.wishlist.length !== dogs.length) {
      console.log('\n⚠️  DISCREPANCY DETECTED!');
      console.log('Some dog IDs in wishlist may be invalid or dogs may have been deleted');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });