
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import Dog from '../models/dogModel.js';
import fs from 'fs';
import cloudinary from '../utils/cloudinary.js';

console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging line

// Connect to your MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function migrateDogImages() {
  const dogs = await Dog.find({ 'images.url': /\/uploads\// });
  for (const dog of dogs) {
    for (const img of dog.images) {
      if (img.url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), img.url);
        if (fs.existsSync(localPath)) {
          const publicId = `dogs/${dog._id}/migrated-${img.width || 'orig'}`;
          const result = await cloudinary.uploader.upload(localPath, {
            public_id: publicId,
            overwrite: true,
          });
          img.url = result.public_id;
        }
      }
    }
    // Migrate thumbnail if needed
    if (dog.thumbnail && dog.thumbnail.url && dog.thumbnail.url.startsWith('/uploads/')) {
      const thumbPath = path.join(process.cwd(), dog.thumbnail.url);
      if (fs.existsSync(thumbPath)) {
        const thumbPublicId = `dogs/${dog._id}/migrated-thumb-64`;
        const result = await cloudinary.uploader.upload(thumbPath, {
          public_id: thumbPublicId,
          overwrite: true,
        });
        dog.thumbnail.url = result.public_id;
      }
    }
    await dog.save();
    console.log(`Migrated dog ${dog._id}`);
  }
  console.log('Migration complete.');
  process.exit(0);
}

migrateDogImages().catch(e => { console.error(e); process.exit(1); });