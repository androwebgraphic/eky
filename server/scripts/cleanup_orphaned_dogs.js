const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

const Dog = require('../models/dogModel.js');
const uploadsPath = path.join(__dirname, '../uploads/dogs');

async function cleanupOrphanedDogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eky');
    console.log('[CLEANUP] Connected to MongoDB');

    // Get all dogs from database
    const allDogs = await Dog.find({});
    console.log(`[CLEANUP] Found ${allDogs.length} dogs in database`);

    let orphanedCount = 0;
    let validCount = 0;

    for (const dog of allDogs) {
      const dogFolder = path.join(uploadsPath, dog._id.toString());
      const folderExists = fs.existsSync(dogFolder);

      if (!folderExists) {
        console.log(`[CLEANUP] Orphaned dog: ${dog._id} (${dog.name}) - Folder missing`);
        orphanedCount++;
      } else {
        validCount++;
      }
    }

    console.log('[CLEANUP] Summary:');
    console.log(`  - Valid dogs (with images): ${validCount}`);
    console.log(`  - Orphaned dogs (no images): ${orphanedCount}`);

    if (orphanedCount > 0) {
      console.log('\n[CLEANUP] To delete orphaned dogs, run: node server/scripts/delete_orphaned_dogs.js');
    } else {
      console.log('\n[CLEANUP] All dogs have valid image folders!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[CLEANUP] Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedDogs();