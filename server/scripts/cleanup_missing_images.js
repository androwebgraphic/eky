// Script to remove image URLs from Dog documents if the file does not exist on the server
// Usage: node scripts/cleanup_missing_images.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';
const dogSchema = new mongoose.Schema({}, { strict: false, collection: 'dogs' });
const Dog = mongoose.model('Dog', dogSchema);

async function urlExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function cleanupDogImages() {
  await mongoose.connect(mongoUri);
  const dogs = await Dog.find({});
  let updated = 0;
  for (const dog of dogs) {
    let changed = false;
    if (Array.isArray(dog.images)) {
      const newImages = [];
      for (const img of dog.images) {
        if (img.url && await urlExists(img.url)) {
          newImages.push(img);
        } else {
          changed = true;
          console.log(`Removing missing image for dog ${dog._id}: ${img.url}`);
        }
      }
      if (changed) {
        dog.images = newImages;
        dog.markModified('images');
      }
    }
    if (dog.thumbnail && dog.thumbnail.url && !(await urlExists(dog.thumbnail.url))) {
      console.log(`Removing missing thumbnail for dog ${dog._id}: ${dog.thumbnail.url}`);
      dog.thumbnail = undefined;
      changed = true;
      dog.markModified('thumbnail');
    }
    if (changed) {
      await dog.save();
      updated++;
    }
  }
  console.log(`Cleaned up ${updated} dog documents.`);
  await mongoose.disconnect();
}

cleanupDogImages().catch(err => {
  console.error(err);
  process.exit(1);
});
