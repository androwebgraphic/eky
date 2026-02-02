const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Dog = require('../models/dogModel');

dotenv.config();

async function addThumbnails() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eky');
    console.log('Connected to MongoDB');

    const dogs = await Dog.find({});
    console.log(`Found ${dogs.length} dogs`);

    for (const dog of dogs) {
      let changed = false;

      // If dog has images but no thumbnail, create thumbnail from first image
      if (dog.images && dog.images.length > 0 && !dog.thumbnail) {
        const firstImageUrl = dog.images[0].url;
        // Extract filename from URL
        const match = firstImageUrl.match(/\/uploads\/dogs\/([^/]+)\/(.*)/);
        if (match) {
          const [, dogId, filename] = match;
          const thumbUrl = firstImageUrl.replace(filename, 'thumb-64.jpg');
          dog.thumbnail = { url: thumbUrl, width: 64, size: '64' };
          changed = true;
          console.log(`Added thumbnail for dog ${dog.name} (${dog._id})`);
        }
      }

      // If dog has video with poster but no thumbnail, create thumbnail from poster
      if (dog.video && dog.video.poster && dog.video.poster.length > 0 && !dog.thumbnail) {
        const posterUrl = dog.video.poster[0].url;
        const match = posterUrl.match(/\/uploads\/dogs\/([^/]+)\/(.*)/);
        if (match) {
          const [, dogId, filename] = match;
          const thumbUrl = posterUrl.replace(filename, 'thumb-64.jpg');
          dog.thumbnail = { url: thumbUrl, width: 64, size: '64' };
          changed = true;
          console.log(`Added thumbnail for dog ${dog.name} (${dog._id}) from poster`);
        }
      }

      if (changed) {
        await dog.save();
      }
    }

    console.log('Thumbnail migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addThumbnails();
