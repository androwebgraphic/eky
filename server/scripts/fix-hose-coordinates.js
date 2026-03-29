const mongoose = require('mongoose');
require('dotenv').config();

async function fixHoseCoordinates() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sharedog';
    console.log('Connecting to:', mongoUri.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');
    
    const Dog = require('../models/dogModel');
    
    // Find dog named "hose"
    const dog = await Dog.findOne({ name: 'hose' });
    
    if (!dog) {
      console.log('❌ Dog "hose" not found!');
      return;
    }
    
    console.log('Found dog:');
    console.log(`  Name: ${dog.name}`);
    console.log(`  Current location: ${dog.location}`);
    console.log(`  Current coordinates:`, dog.coordinates);
    console.log('');
    
    // Geocode location to get correct coordinates
    const geocodeLocation = async (location) => {
      if (!location) return null;
      try {
        const query = location.trim();
        console.log(`[GEOCODE] Querying: "${query}"`);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
          headers: {
            'User-Agent': 'EkyApp/1.0'
          }
        });
        const data = await resp.json();
        
        if (data && data.length > 0) {
          console.log(`[GEOCODE] Found: ${data[0].display_name}`);
          console.log(`[GEOCODE] Coordinates: [${data[0].lon}, ${data[0].lat}]`);
          return {
            type: 'Point',
            coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
          };
        } else {
          console.log(`[GEOCODE] No results found for "${query}"`);
        }
      } catch (e) {
        console.error('[GEOCODE] Error:', e);
      }
      return null;
    };
    
    const coordinates = await geocodeLocation(dog.location);
    
    if (coordinates) {
      // Update dog with new coordinates
      await Dog.findByIdAndUpdate(dog._id, { coordinates });
      console.log('\n✅ Successfully geocoded and updated!');
      console.log(`   New coordinates: [${coordinates.coordinates[0].toFixed(6)}, ${coordinates.coordinates[1].toFixed(6)}]`);
    } else {
      console.log('\n❌ Failed to geocode location');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixHoseCoordinates();