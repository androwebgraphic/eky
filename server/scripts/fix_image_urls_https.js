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
  const dogs = await Dog.find({
    $or: [
      { 'images.url': { $regex: '^http://' } },
      { 'thumbnail.url': { $regex: '^http://' } }
    ]
  });
  let updated = 0;
  for (const dog of dogs) {
    let changed = false;
    if (Array.isArray(dog.images)) {
      dog.images = dog.images.map(img => {
        if (img.url && img.url.startsWith('http://')) {
          changed = true;
          return { ...img, url: img.url.replace('http://', 'https://') };
        }
        return img;
      });
    }
    if (dog.thumbnail && dog.thumbnail.url && dog.thumbnail.url.startsWith('http://')) {
      dog.thumbnail.url = dog.thumbnail.url.replace('http://', 'https://');
      changed = true;
    }
    if (changed) {
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
