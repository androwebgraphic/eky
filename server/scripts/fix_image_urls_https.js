// Script to update all Dog image URLs in MongoDB from http to https
// Usage: node scripts/fix_image_urls_https.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';
console.log('Connecting to MongoDB URI:', mongoUri);

const dogSchema = new mongoose.Schema({}, { strict: false, collection: 'dogs' });
const Dog = mongoose.model('Dog', dogSchema);

async function fixDogImageUrls() {
  await mongoose.connect(mongoUri);
  const dogs = await Dog.find({});
  let updated = 0;
  for (const dog of dogs) {
    let changed = false;
    const oldImages = (dog.images || []).map(img => img.url);
    const oldThumb = dog.thumbnail && dog.thumbnail.url;
    let newImages = dog.images;
    let newThumbnail = dog.thumbnail;
    if (Array.isArray(dog.images)) {
      newImages = dog.images.map(img => {
        if (img.url) {
          let newUrl = img.url;
          // Replace any http://... with http://localhost:3001 + path
          newUrl = newUrl.replace(
            /^http:\/\/[^/]+(\/uploads\/dogs\/.*)$/,
            'http://localhost:3001$1'
          );
          if (newUrl !== img.url) changed = true;
          return { ...img, url: newUrl };
        }
        return img;
      });
    }
    if (dog.thumbnail && dog.thumbnail.url) {
      let newThumbUrl = dog.thumbnail.url;
      newThumbUrl = newThumbUrl.replace(
        /^http:\/\/[^/]+(\/uploads\/dogs\/.*)$/,
        'http://localhost:3001$1'
      );
      if (newThumbUrl !== dog.thumbnail.url) {
        changed = true;
        newThumbnail = { ...dog.thumbnail, url: newThumbUrl };
      }
    }
    if (changed) {
      console.log(`Dog _id: ${dog._id}`);
      console.log('Old images:', oldImages);
      console.log('New images:', (newImages || []).map(img => img.url));
      console.log('Old thumbnail:', oldThumb);
      console.log('New thumbnail:', newThumbnail && newThumbnail.url);
      // Force update using updateOne
      await Dog.updateOne(
        { _id: dog._id },
        { $set: { images: newImages, thumbnail: newThumbnail } }
      );
      // Immediately re-fetch and print the document to verify persistence
      const freshDog = await Dog.findById(dog._id);
      console.log('Persisted images:', (freshDog.images || []).map(img => img.url));
      console.log('Persisted thumbnail:', freshDog.thumbnail && freshDog.thumbnail.url);
      updated++;
    }
  }
  console.log(`Updated ${updated} dog documents.`);

  await mongoose.disconnect();
}

fixDogImageUrls().catch(err => {
  console.error(err);
  process.exit(1);
});
