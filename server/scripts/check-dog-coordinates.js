const mongoose = require('mongoose');
require('dotenv').config();

async function checkDogs() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sharedog';
    console.log('Connecting to:', mongoUri.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');
    
    const Dog = require('../models/dogModel');
    
    // Find all dogs and check their coordinates
    const dogs = await Dog.find().select('name location coordinates').lean();
    
    console.log('='.repeat(80));
    console.log('DOG COORDINATES REPORT');
    console.log('='.repeat(80));
    
    let validCoords = 0;
    let zeroCoords = 0;
    let missingCoords = 0;
    
    dogs.forEach((dog, index) => {
      const coords = dog.coordinates?.coordinates || [0, 0];
      const hasValidCoords = coords[0] !== 0 && coords[1] !== 0;
      
      if (hasValidCoords) {
        validCoords++;
      } else {
        zeroCoords++;
      }
      
      const status = hasValidCoords ? '✅ Valid' : '❌ [0,0]';
      console.log(`${index + 1}. ${dog.name}`);
      console.log(`   Location: ${dog.location || 'N/A'}`);
      console.log(`   Coordinates: [${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}]`);
      console.log(`   Status: ${status}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('SUMMARY:');
    console.log(`  Total dogs: ${dogs.length}`);
    console.log(`  Valid coordinates: ${validCoords}`);
    console.log(`  [0,0] coordinates: ${zeroCoords}`);
    console.log('='.repeat(80));
    
    // Find dogs from "donji miholjac" specifically
    const donjiDogs = dogs.filter(d => d.location && d.location.toLowerCase().includes('donji miholjac'));
    
    if (donjiDogs.length > 0) {
      console.log('\nDOGS FROM DONJI MIHOLJAC:');
      donjiDogs.forEach((dog, index) => {
        const coords = dog.coordinates?.coordinates || [0, 0];
        const hasValidCoords = coords[0] !== 0 && coords[1] !== 0;
        const status = hasValidCoords ? '✅' : '❌';
        console.log(`  ${index + 1}. ${dog.name}: ${status} [${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}]`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDogs();