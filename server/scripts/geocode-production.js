const mongoose = require('mongoose');
const Dog = require('../models/dogModel');
const path = require('path');

// Load .env file (same way as create-geospatial-index.js)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eky';
    console.log('[GEOCODE] Connecting to MongoDB...');
    console.log('[GEOCODE] Using URI:', uri.replace(/:([^:@]+)@/, ':***@')); // Hide password
    await mongoose.connect(uri);
    console.log('[GEOCODE] ✅ Connected to MongoDB');
  } catch (error) {
    console.error('[GEOCODE] ❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Geocode a location string to coordinates
const geocodeLocation = async (location) => {
  if (!location) return null;
  try {
    const query = location.trim();
    console.log(`[GEOCODE] Geocoding: "${query}"`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'User-Agent': 'EkyApp/1.0'
      }
    });
    const data = await resp.json();
    if (data && data.length > 0) {
      const coords = {
        type: 'Point',
        coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
      };
      console.log(`[GEOCODE] ✅ Geocoded to:`, coords.coordinates);
      return coords;
    } else {
      console.log(`[GEOCODE] ⚠️  No results for: "${query}"`);
    }
  } catch (e) {
    console.error(`[GEOCODE] ❌ Geocoding error for "${location}":`, e.message);
  }
  return null;
};

// Main migration function
const migrateDogs = async () => {
  await connectDB();

  try {
    console.log('[GEOCODE] ========== STARTING MIGRATION ==========');
    
    // Find all dogs with coordinates [0,0]
    const dogs = await Dog.find({
      'coordinates.coordinates': [0, 0]
    });
    
    console.log(`[GEOCODE] Found ${dogs.length} dogs to geocode`);
    
    if (dogs.length === 0) {
      console.log('[GEOCODE] ✅ All dogs are already geocoded!');
      process.exit(0);
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each dog
    for (let i = 0; i < dogs.length; i++) {
      const dog = dogs[i];
      console.log(`\n[GEOCODE] Processing ${i + 1}/${dogs.length}: ${dog.name} (${dog.location})`);
      
      // Geocode the location
      const coordinates = await geocodeLocation(dog.location);
      
      if (coordinates) {
        await Dog.findByIdAndUpdate(dog._id, { coordinates });
        successCount++;
        console.log(`[GEOCODE] ✅ Successfully geocoded ${dog.name}`);
      } else {
        failureCount++;
        console.log(`[GEOCODE] ❌ Failed to geocode ${dog.name}`);
      }
      
      // Wait 1 second between requests (Nominatim rate limit)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n[GEOCODE] ========== MIGRATION COMPLETE ==========');
    console.log(`[GEOCODE] ✅ Successfully geocoded: ${successCount} dogs`);
    console.log(`[GEOCODE] ❌ Failed to geocode: ${failureCount} dogs`);
    console.log(`[GEOCODE] ===========================================\n`);
    
    // Create 2dsphere index
    console.log('[GEOCODE] Creating 2dsphere index...');
    try {
      await Dog.collection.createIndex({ coordinates: '2dsphere' });
      console.log('[GEOCODE] ✅ 2dsphere index created successfully');
    } catch (indexErr) {
      console.log('[GEOCODE] ℹ️  Index may already exist:', indexErr.message);
    }
    
    console.log('\n[GEOCODE] ✅ Migration complete! Refresh your browser to see dogs sorted by distance.');
    
  } catch (error) {
    console.error('[GEOCODE] Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[GEOCODE] Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateDogs();