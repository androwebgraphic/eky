const mongoose = require('mongoose');
const path = require('path');

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

console.log('[INDEX] Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[INDEX] Connected to MongoDB');
    
    // Get the dogs collection
    const db = mongoose.connection.db;
    const dogsCollection = db.collection('dogs');
    
    // Check existing indexes
    console.log('\n[INDEX] Checking existing indexes on dogs collection...');
    const indexes = await dogsCollection.indexes();
    console.log('[INDEX] Current indexes:', indexes.map(i => i.name));
    
    // Check if 2dsphere index exists
    const hasGeospatialIndex = indexes.some(idx => 
      idx.key && idx.key.coordinates === '2dsphere'
    );
    
    if (hasGeospatialIndex) {
      console.log('\n[INDEX] ✅ 2dsphere index already exists on coordinates field');
    } else {
      console.log('\n[INDEX] Creating 2dsphere index on coordinates field...');
      try {
        const result = await dogsCollection.createIndex(
          { coordinates: '2dsphere' },
          { name: 'coordinates_2dsphere' }
        );
        console.log('[INDEX] ✅ 2dsphere index created successfully:', result);
      } catch (error) {
        console.error('[INDEX] ❌ Failed to create index:', error.message);
      }
    }
    
    // Verify the index
    console.log('\n[INDEX] Verifying indexes after update...');
    const finalIndexes = await dogsCollection.indexes();
    const geospatialIndex = finalIndexes.find(idx => 
      idx.key && idx.key.coordinates === '2dsphere'
    );
    
    if (geospatialIndex) {
      console.log('[INDEX] ✅ Geospatial index confirmed:');
      console.log('   - Name:', geospatialIndex.name);
      console.log('   - Key:', JSON.stringify(geospatialIndex.key));
    } else {
      console.log('[INDEX] ⚠️  Geospatial index not found');
    }
    
    await mongoose.disconnect();
    console.log('\n[INDEX] Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(error => {
    console.error('[INDEX] ❌ Connection error:', error.message);
    process.exit(1);
  });