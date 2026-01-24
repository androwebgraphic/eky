// Usage: node migrate_image_urls_localhost.js
// This script updates all dog image URLs in MongoDB to use your local backend address.
// Adjust NEW_BASE_URL as needed (e.g., http://localhost:3001 or your LAN IP).

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';
const OLD_BASE_URL = 'https://sharedog-homeless-backend.onrender.com';
const NEW_BASE_URL = 'http://localhost:3001'; // Change to your backend address if needed

const dogSchema = new mongoose.Schema({}, { strict: false });
const Dog = mongoose.model('Dog', dogSchema, 'dogs');

async function migrateDogImageUrls() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const dogs = await Dog.find({ 'images.url': { $regex: OLD_BASE_URL } });
  console.log(`Found ${dogs.length} dogs with old image URLs.`);
  for (const dog of dogs) {
    let updated = false;
    if (Array.isArray(dog.images)) {
      dog.images = dog.images.map(img => {
        if (img.url && typeof img.url === 'string' && img.url.startsWith(OLD_BASE_URL)) {
          updated = true;
          return { ...img, url: img.url.replace(OLD_BASE_URL, NEW_BASE_URL) };
        }
        return img;
      });
    }
    if (dog.thumbnail && dog.thumbnail.url && typeof dog.thumbnail.url === 'string' && dog.thumbnail.url.startsWith(OLD_BASE_URL)) {
      dog.thumbnail.url = dog.thumbnail.url.replace(OLD_BASE_URL, NEW_BASE_URL);
      updated = true;
    }
    if (updated) {
      await dog.save();
      console.log(`Updated dog: ${dog.name} (${dog._id})`);
    }
  }
  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrateDogImageUrls().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
