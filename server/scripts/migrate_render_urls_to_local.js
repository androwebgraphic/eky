// Script to migrate all Dog image, thumbnail, and video URLs from absolute render.com URLs to local relative URLs
import mongoose from 'mongoose';
import Dog from '../models/dogModel.js';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const RENDER_PREFIX = 'https://sharedog-homeless-backend.onrender.com';
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

async function migrateDogImageUrls() {
  await mongoose.connect(MONGO_URI);
  const dogs = await Dog.find();
  let updated = 0;
  for (const dog of dogs) {
    let changed = false;
    // Images
    if (Array.isArray(dog.images)) {
      dog.images = dog.images.map(img => {
        if (img.url && img.url.startsWith(RENDER_PREFIX + '/uploads')) {
          changed = true;
          return { ...img, url: img.url.replace(RENDER_PREFIX, '') };
        }
        return img;
      });
    }
    // Thumbnail
    if (dog.thumbnail && dog.thumbnail.url && dog.thumbnail.url.startsWith(RENDER_PREFIX + '/uploads')) {
      dog.thumbnail.url = dog.thumbnail.url.replace(RENDER_PREFIX, '');
      changed = true;
    }
    // Video poster
    if (dog.video && Array.isArray(dog.video.poster)) {
      dog.video.poster = dog.video.poster.map(img => {
        if (img.url && img.url.startsWith(RENDER_PREFIX + '/uploads')) {
          changed = true;
          return { ...img, url: img.url.replace(RENDER_PREFIX, '') };
        }
        return img;
      });
    }
    // Video url
    if (dog.video && dog.video.url && dog.video.url.startsWith(RENDER_PREFIX + '/uploads')) {
      dog.video.url = dog.video.url.replace(RENDER_PREFIX, '');
      changed = true;
    }
    if (changed) {
      await dog.save();
      updated++;
      console.log(`Updated dog: ${dog._id} (${dog.name})`);
    }
  }
  console.log(`Migration complete. Updated ${updated} dogs.`);
  await mongoose.disconnect();
}

migrateDogImageUrls().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
