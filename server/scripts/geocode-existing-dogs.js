const mongoose = require('mongoose');
const Dog = require('../models/dogModel');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eky');
    console.log('[GEOCODE] Connected to MongoDB');
  } catch (error) {
    console.error('[GEOCODE] MongoDB connection error:', error);
    process.exit(1);
  }
};

// Geocode a location string to coordinates
const geocodeLocation = async (location) => {
  if (!location) return null;
  try {
    const query = location.trim();
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'User-Agent': 'EkyApp/1.0'
      }
    });
    const data = await resp.json();
    if (data && data.length > 0) {
      return {
        type: 'Point',
        coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
      };
    }
  } catch (e) {
    console.error('[GEOCODE] Error geocoding location:', e);
  }
  return null;
};

// Main migration function
const migrateDogs = async () => {
  await connectDB();

  try {
    console.log('[GEOCODE] Starting migration...');
    
    // Find all dogs with location but no coordinates (or default [0,0])
    const dogs = await Dog.find({
      location: { $exists: true, $ne: '' },
      $or: [
        { coordinates: { $exists: false } },
        { 'coordinates.coordinates': [0, 0] }
      ]
    });

    console.log(`[GEOCODE] Found ${dogs.length} dogs to geocode`);

    let successCount = 0;
    let failureCount = 0;

    for (const dog of dogs) {
      console.log(`[GEOCODE] Processing dog: ${dog.name} (${dog.location})`);
      
      const coordinates = await geocodeLocation(dog.location);
      
      if (coordinates) {
        await Dog.findByIdAndUpdate(dog._id, { coordinates });
        console.log(`[GEOCODE] ✅ Updated coordinates for ${dog.name}`);
        successCount++;
        
        // Add a small delay to respect Nominatim's rate limiting (1 request per second max)
        await new Promise(resolve => setTimeout(resolve, 1100));
      } else {
        console.warn(`[GEOCODE] ❌ Failed to geocode location for ${dog.name}: ${dog.location}`);
        failureCount++;
      }
    }

    console.log(`[GEOCODE] Migration complete. Success: ${successCount}, Failed: ${failureCount}`);
    
    // Create 2dsphere index for geospatial queries
    console.log('[GEOCODE] Creating 2dsphere index on coordinates field...');
    try {
      await Dog.collection.createIndex({ coordinates: '2dsphere' });
      console.log('[GEOCODE] ✅ 2dsphere index created successfully');
    } catch (indexError) {
      console.warn('[GEOCODE] Index may already exist or error occurred:', indexError.message);
    }

  } catch (error) {
    console.error('[GEOCODE] Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[GEOCODE] Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateDogs();