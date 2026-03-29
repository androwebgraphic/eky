const mongoose = require('mongoose');
require('dotenv').config();

async function testLocationSorting() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sharedog';
    console.log('Connecting to:', mongoUri.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');
    
    // Require User model first
    require('../models/userModel');
    const Dog = require('../models/dogModel');
    
    // Simulate user location (Donji Miholjac)
    const userLat = 45.760796;
    const userLng = 18.165204;
    
    console.log('='.repeat(80));
    console.log('TESTING LOCATION-BASED SORTING');
    console.log('='.repeat(80));
    console.log(`User location: [${userLng}, ${userLat}] (Donji Miholjac)`);
    console.log('');
    
    // Fetch all dogs
    const allDogs = await Dog.find()
      .populate('user', 'name username email phone person')
      .lean();
    
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    };
    
    // Add distance to each dog and separate by coordinates
    const dogsWithValidCoords = [];
    const dogsWithZeroCoords = [];
    
    allDogs.forEach(dog => {
      const coords = dog.coordinates?.coordinates;
      if (coords && coords[0] !== 0 && coords[1] !== 0) {
        // Valid coordinates - calculate distance
        dog.distance = calculateDistance(
          userLat, userLng,
          coords[1], coords[0] // Note: coords[0] is longitude, coords[1] is latitude
        ) * 1000; // Convert to meters
        dogsWithValidCoords.push(dog);
      } else {
        // Invalid or [0,0] coordinates
        dog.distance = null;
        dogsWithZeroCoords.push(dog);
      }
    });
    
    // Sort dogs with valid coords by distance (nearest first)
    dogsWithValidCoords.sort((a, b) => a.distance - b.distance);
    
    // Sort [0,0] dogs by creation date (newest first)
    dogsWithZeroCoords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Combine results
    const sortedDogs = [...dogsWithValidCoords, ...dogsWithZeroCoords];
    
    console.log('SORTED DOGS (Nearest First):');
    console.log('-'.repeat(80));
    sortedDogs.forEach((dog, index) => {
      const dist = dog.distance ? (dog.distance / 1000).toFixed(2) + ' km' : 'N/A';
      const coords = dog.coordinates?.coordinates || [0, 0];
      console.log(`${index + 1}. ${dog.name} - ${dog.location || 'N/A'}`);
      console.log(`   Distance: ${dist}`);
      console.log(`   Coordinates: [${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}]`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('EXPECTED ORDER (for user in Donji Miholjac):');
    console.log('1. Fify (Donji Miholjac) - ~0 km');
    console.log('2. Joca (Donji Miholjac) - ~0 km');
    console.log('3-8. Other dogs by distance');
    console.log('='.repeat(80));
    
    console.log('\nDONJI MIHOLJAC DOGS:');
    const donjiDogs = sortedDogs.filter(d => d.location && d.location.toLowerCase().includes('donji miholjac'));
    donjiDogs.forEach((dog, index) => {
      const position = sortedDogs.indexOf(dog) + 1;
      const dist = dog.distance ? (dog.distance / 1000).toFixed(2) + ' km' : 'N/A';
      console.log(`${index + 1}. ${dog.name} - Position: ${position}, Distance: ${dist}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testLocationSorting();