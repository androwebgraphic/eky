import mongoose from 'mongoose';
import Dog from '../models/dogModel.js';
import User from '../models/userModel.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function deleteOrphanedDogs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all dogs and check if their user exists after populate
    const allDogs = await Dog.find().populate('user');
    const orphanedDogs = allDogs.filter(dog => !dog.user);
    
    console.log(`\nFound ${orphanedDogs.length} orphaned dogs (null or deleted user):`);
    
    for (const dog of orphanedDogs) {
      console.log(`  - ${dog.name} (${dog._id})`);
      
      // Delete associated files
      const dogDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
      if (fs.existsSync(dogDir)) {
        console.log(`    Deleting directory: ${dogDir}`);
        fs.rmSync(dogDir, { recursive: true, force: true });
      }
      
      // Delete from database
      await Dog.findByIdAndDelete(dog._id);
      console.log(`    ✅ Deleted from database`);
    }
    
    console.log(`\n✅ Deleted ${orphanedDogs.length} orphaned dogs`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteOrphanedDogs();
