// Script to update all Dog image URLs in MongoDB from http to https
// Usage: node scripts/fix-dog-image-https.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';
console.log('Connecting to MongoDB URI:', mongoUri);

const Dog = require('../models/dogModel');

async function fixDogImageUrls() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const dogs = await Dog.find({});
    let updated = 0;
    
    for (const dog of dogs) {
      let changed = false;
      const dogImages = dog.images || [];
      const dogThumbnail = dog.thumbnail;
      
      // Process images array
      let newImages = dogImages;
      if (Array.isArray(dogImages)) {
        newImages = dogImages.map(img => {
          if (img.url && img.url.startsWith('http://')) {
            console.log(`  Found HTTP URL in dog ${dog.name || dog._id}: ${img.url.substring(0, 80)}...`);
            changed = true;
            return { ...img, url: img.url.replace('http://', 'https://') };
          }
          return img;
        });
      }
      
      // Process thumbnail
      let newThumbnail = dogThumbnail;
      if (dogThumbnail && dogThumbnail.url && dogThumbnail.url.startsWith('http://')) {
        console.log(`  Found HTTP URL in thumbnail of dog ${dog.name || dog._id}: ${dogThumbnail.url.substring(0, 80)}...`);
        changed = true;
        newThumbnail = { ...dogThumbnail, url: dogThumbnail.url.replace('http://', 'https://') };
      }
      
      if (changed) {
        console.log(`Updating dog: ${dog.name || dog._id}`);
        await Dog.updateOne(
          { _id: dog._id },
          { $set: { images: newImages, thumbnail: newThumbnail } }
        );
        updated++;
      }
    }
    
    console.log(`\n✅ Updated ${updated} dog documents with HTTPS image URLs.`);
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDogImageUrls().catch(err => {
  console.error(err);
  process.exit(1);
});