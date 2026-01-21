// Script to update all Dog image URLs in MongoDB from http to https
// Usage: node scripts/fix_image_urls_https.js

import mongoose from 'mongoose';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';

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
    if (Array.isArray(dog.images)) {
      dog.images = dog.images.map(img => {
        if (img.url) {
          let newUrl = img.url;
          // Replace all occurrences, not just at the start
          newUrl = newUrl.replace(/http:\/\/localhost:3001/g, 'https://sharedog-homeless-backend.onrender.com');
          newUrl = newUrl.replace(/http:\/\/172.20.10.2:3001/g, 'https://sharedog-homeless-backend.onrender.com');
          newUrl = newUrl.replace(/http:\/\//g, 'https://');
          if (newUrl !== img.url) changed = true;
          return { ...img, url: newUrl };
        }
        return img;
      });
      if (changed) dog.markModified('images');
    }
    if (dog.thumbnail && dog.thumbnail.url) {
      let newThumbUrl = dog.thumbnail.url;
      newThumbUrl = newThumbUrl.replace(/http:\/\/localhost:3001/g, 'https://sharedog-homeless-backend.onrender.com');
      newThumbUrl = newThumbUrl.replace(/http:\/\/172.20.10.2:3001/g, 'https://sharedog-homeless-backend.onrender.com');
      newThumbUrl = newThumbUrl.replace(/http:\/\//g, 'https://');
      if (newThumbUrl !== dog.thumbnail.url) {
        changed = true;
        dog.thumbnail.url = newThumbUrl;
        dog.markModified('thumbnail');
      }
    }
    if (changed) {
      console.log(`Dog _id: ${dog._id}`);
      console.log('Old images:', oldImages);
      console.log('New images:', (dog.images || []).map(img => img.url));
      console.log('Old thumbnail:', oldThumb);
      console.log('New thumbnail:', dog.thumbnail && dog.thumbnail.url);
      await dog.save();
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
