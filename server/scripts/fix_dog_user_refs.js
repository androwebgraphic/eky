// Script to fix dog user references in MongoDB
// Usage: node server/scripts/fix_dog_user_refs.js

import mongoose from 'mongoose';
import Dog from '../models/dogModel.js';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Find all dogs with missing or invalid user references
  const dogs = await Dog.find();
  const users = await User.find();
  if (users.length === 0) {
    console.error('No users found in database.');
    process.exit(1);
  }
  const defaultUser = users[0];

  let fixed = 0;
  for (const dog of dogs) {
    if (!dog.user || typeof dog.user === 'string' || !mongoose.Types.ObjectId.isValid(dog.user)) {
      dog.user = defaultUser._id;
      await dog.save();
      fixed++;
      console.log(`Fixed dog: ${dog.name} (${dog._id})`);
    }
  }
  console.log(`Finished. Fixed ${fixed} dogs.`);
  mongoose.disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
