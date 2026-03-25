const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

const Dog = require('../models/dogModel.js');
const uploadsPath = path.join(__dirname, '../uploads/dogs');

async function deleteOrphanedDogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eky');
    console.log('[DELETE] Connected to MongoDB');

    // Get all dogs from database
    const allDogs = await Dog.find({});
    console.log(`[DELETE] Found ${allDogs.length} dogs in database`);

    let orphanedCount = 0;
    let validCount = 0;
    let deletedIds = [];

    for (const dog of allDogs) {
      const dogFolder = path.join(uploadsPath, dog._id.toString());
      const folderExists = fs.existsSync(dogFolder);

      if (!folderExists) {
        console.log(`[DELETE] Deleting orphaned dog: ${dog._id} (${dog.name}) - Folder missing`);
        deletedIds.push(dog._id);
        orphanedCount++;
      } else {
        validCount++;
      }
    }

    if (deletedIds.length === 0) {
      console.log('[DELETE] No orphaned dogs found. All dogs have valid image folders!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Delete all orphaned dogs
    console.log(`\n[DELETE] Deleting ${deletedIds.length} orphaned dogs...`);
    const deleteResult = await Dog.deleteMany({ _id: { $in: deletedIds } });
    console.log(`[DELETE] Deleted ${deleteResult.deletedCount} dogs from database`);

    console.log(`\n[DELETE] Summary:`);
    console.log(`  - Valid dogs (with images): ${validCount}`);
    console.log(`  - Orphaned dogs deleted: ${orphanedCount}`);

    await mongoose.disconnect();
    console.log('[DELETE] Done!');
    process.exit(0);
  } catch (error) {
    console.error('[DELETE] Error:', error);
    process.exit(1);
  }
}

deleteOrphanedDogs();