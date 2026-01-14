import mongoose from 'mongoose';
import Dog from '../models/dogModel.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function checkDogs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const allDogs = await Dog.find();
    console.log(`\nTotal dogs in database: ${allDogs.length}\n`);
    
    for (const dog of allDogs) {
      console.log(`- ${dog.name} (${dog._id})`);
      console.log(`  user: ${dog.user || 'null'}`);
      console.log(`  user === null: ${dog.user === null}`);
      console.log(`  !dog.user: ${!dog.user}`);
      console.log();
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDogs();
