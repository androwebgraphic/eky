const mongoose = require('mongoose');
require('dotenv').config();

async function verifyAllCoordinates() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sharedog';
    console.log('Connecting to:', mongoUri.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');
    
    const Dog = require('../models/dogModel');
    
    console.log('='.repeat(80));
    console.log('VERIFYING ALL DOG COORDINATES');
    console.log('='.repeat(80));
    
    const dogs = await Dog.find().select('name location coordinates').lean();
    
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
            coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
            display_name: data[0].display_name
          };
        }
      } catch (e) {
        console.error('[GEOCODE] Error:', e);
      }
      return null;
    };
    
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const dogsToFix = [];
    
    for (const dog of dogs) {
      console.log(`\nChecking: ${dog.name} (${dog.location})`);
      
      // Geocode current location to get correct coordinates
      const correctCoords = await geocodeLocation(dog.location);
      
      if (!correctCoords) {
        console.log(`  ⚠️  Could not geocode location`);
        continue;
      }
      
      const currentCoords = dog.coordinates?.coordinates;
      
      // Calculate distance between current and correct coordinates
      if (currentCoords && currentCoords[0] !== 0 && currentCoords[1] !== 0) {
        const dist = calculateDistance(
          correctCoords.coordinates[1], correctCoords.coordinates[0],
          currentCoords[1], currentCoords[0]
        );
        
        console.log(`  Current: [${currentCoords[0].toFixed(6)}, ${currentCoords[1].toFixed(6)}]`);
        console.log(`  Correct:  [${correctCoords.coordinates[0].toFixed(6)}, ${correctCoords.coordinates[1].toFixed(6)}]`);
        console.log(`  Distance from correct: ${dist.toFixed(2)} km`);
        console.log(`  Found: ${correctCoords.display_name}`);
        
        // If difference is more than 10km, mark for fixing
        if (dist > 10) {
          console.log(`  ❌ WRONG COORDINATES - Difference: ${dist.toFixed(2)} km`);
          dogsToFix.push({
            name: dog.name,
            _id: dog._id,
            location: dog.location,
            currentCoords,
            correctCoords: correctCoords.coordinates
          });
        } else {
          console.log(`  ✅ Coordinates OK`);
        }
        
        // Wait 1 second between requests (Nominatim rate limit)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`  ❌ No coordinates or [0,0]`);
        dogsToFix.push({
          name: dog.name,
          _id: dog._id,
          location: dog.location,
          currentCoords: currentCoords || [0, 0],
          correctCoords: correctCoords.coordinates
        });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('DOGS THAT NEED FIXING:');
    console.log('='.repeat(80));
    
    if (dogsToFix.length === 0) {
      console.log('✅ All coordinates are correct!');
    } else {
      for (const dog of dogsToFix) {
        console.log(`\n${dog.name}: ${dog.location}`);
        console.log(`  Current: [${dog.currentCoords[0].toFixed(6)}, ${dog.currentCoords[1].toFixed(6)}]`);
        console.log(`  Should be: [${dog.correctCoords[0].toFixed(6)}, ${dog.correctCoords[1].toFixed(6)}]`);
      }
      
      console.log('\n' + '='.repeat(80));
      console.log(`Total dogs to fix: ${dogsToFix.length}`);
      console.log('='.repeat(80));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyAllCoordinates();