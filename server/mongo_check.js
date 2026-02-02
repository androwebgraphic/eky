// Usage: node mongo_check.js
// This script lists all collections and documents in your MongoDB 'eky' database.

const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb+srv://andreassklizovic:jl31156l@eky.zw3yij8.mongodb.net/eky?retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).limit(10).toArray();
    console.log(`\nFirst 10 documents in '${col.name}':`);
    console.dir(docs, { depth: null });
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
