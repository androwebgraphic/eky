const mongoose = require('mongoose');
const Dog = require('../models/dogModel');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eky');
    console.log('[TEST] Connected to MongoDB');
  } catch (error) {
    console.error('[TEST] MongoDB connection error:', error);
    process.exit(1);
  }
};

// Geocode a location string to coordinates
const geocodeLocation = async (location) => {
  if (!location) return null;
  try {
    const query = location.trim();
    console.log('[TEST] Geocoding:', query);
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
      console.log('[TEST] ✅ Geocoded to:', coords);
      return coords;
    }
  } catch (e) {
    console.error('[TEST] ❌ Geocoding error:', e);
  }
  return null;
};

// Main test function
const testGeocode = async () => {
  await connectDB();

  try {
    console.log('[TEST] ========== TESTING GEOCODING ==========');
    
    // Find ONE dog with coordinates [0,0]
    const dog = await Dog.findOne({
      'coordinates.coordinates': [0, 0]
    });
    
    if (!dog) {
      console.log('[TEST] No dogs with default coordinates found!');
      console.log('[TEST] All dogs may already be geocoded');
      process.exit(0);
    }
    
    console.log(`[TEST] Found dog to geocode: ${dog.name} (${dog.location})`);
    
    // Geocode the location
    const coordinates = await geocodeLocation(dog.location);
    
    if (coordinates) {
      await Dog.findByIdAndUpdate(dog._id, { coordinates });
      console.log(`[TEST] ✅ Successfully geocoded ${dog.name}!`);
      console.log('[TEST] ====================================================');
      console.log('[TEST] Now refresh your browser and you should see this dog sorted by distance!');
      console.log('[TEST] ====================================================');
    } else {
      console.log(`[TEST] ❌ Failed to geocode location: ${dog.location}`);
    }
    
  } catch (error) {
    console.error('[TEST] Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[TEST] Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run test
testGeocode();