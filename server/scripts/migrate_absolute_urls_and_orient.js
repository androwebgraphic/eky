// Usage: node scripts/migrate_absolute_urls_and_orient.js
// Updates all Dog docs to use absolute URLs and auto-rotates all images using EXIF
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI;
const API_BASE = process.env.API_BASE || `http://localhost:3001`;

const Dog = mongoose.model('Dog', new mongoose.Schema({
  images: [{ url: String }],
  thumbnail: { url: String },
  video: { url: String, poster: [{ url: String }] }
}, { strict: false }));

function toAbs(u) {
  if (!u) return u;
  return u.startsWith('http') ? u : `${API_BASE}${u}`;
}

async function fixOrientation(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const rotated = await sharp(buffer).rotate().toBuffer();
    fs.writeFileSync(filePath, rotated);
    return true;
  } catch (e) {
    console.warn('Orientation fix failed for', filePath, e.message);
    return false;
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const dogs = await Dog.find();
  for (const dog of dogs) {
    let changed = false;
    // Fix images
    if (Array.isArray(dog.images)) {
      for (const img of dog.images) {
        if (img.url && !img.url.startsWith('http')) {
          img.url = toAbs(img.url); changed = true;
        }
        // Fix orientation for each image file
        const m = img.url.match(/\/uploads\/dogs\/([^/]+)\/(image-[0-9]+\.jpg)/);
        if (m) {
          const filePath = path.join(process.cwd(), 'uploads', 'dogs', m[1], m[2]);
          await fixOrientation(filePath);
        }
      }
    }
    // Fix thumbnail
    if (dog.thumbnail && dog.thumbnail.url && !dog.thumbnail.url.startsWith('http')) {
      dog.thumbnail.url = toAbs(dog.thumbnail.url); changed = true;
      const m = dog.thumbnail.url.match(/\/uploads\/dogs\/([^/]+)\/(thumb-64\.jpg)/);
      if (m) {
        const filePath = path.join(process.cwd(), 'uploads', 'dogs', m[1], m[2]);
        await fixOrientation(filePath);
      }
    }
    // Fix video
    if (dog.video && dog.video.url && !dog.video.url.startsWith('http')) {
      dog.video.url = toAbs(dog.video.url); changed = true;
    }
    // Fix video posters
    if (dog.video && Array.isArray(dog.video.poster)) {
      for (const poster of dog.video.poster) {
        if (poster.url && !poster.url.startsWith('http')) {
          poster.url = toAbs(poster.url); changed = true;
        }
        const m = poster.url && poster.url.match(/\/uploads\/dogs\/([^/]+)\/(poster-[0-9]+\.jpg)/);
        if (m) {
          const filePath = path.join(process.cwd(), 'uploads', 'dogs', m[1], m[2]);
          await fixOrientation(filePath);
        }
      }
    }
    if (changed) {
      await dog.save();
      console.log('Updated', dog._id);
    }
  }
  await mongoose.disconnect();
  console.log('Migration complete.');
}

main();
