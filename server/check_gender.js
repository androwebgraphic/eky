const mongoose = require('mongoose');

// Connect to MongoDB
const DB_URI = 'mongodb+srv://eckys:A7Fhh7WQadRpBTsz@cluster0.zw3yij8.mongodb.net/eky?retryWrites=true&w=majority';
mongoose.connect(DB_URI);

const dogSchema = new mongoose.Schema({
  name: String,
  breed: String,
  age: Number,
  gender: { type: String, enum: ['male', 'female'] },
  images: Array,
  thumbnail: Object,
  color: String,
  place: String,
  size: String,
  vaccinated: Boolean,
  neutered: Boolean,
  description: String,
  video: Object
});

const Dog = mongoose.model('Dog', dogSchema);

(async () => {
  try {
    // Check first 5 dogs
    const dogs = await Dog.find().limit(5);
    console.log('First 5 dogs gender status:');
    dogs.forEach((dog, i) => {
      console.log(`${i+1}. ${dog.name} - gender: ${dog.gender || 'NOT SET'} - ID: ${dog._id}`);
    });
    
    // Update first two dogs to have gender values for testing
    if (dogs.length > 0) {
      if (!dogs[0].gender) {
        await Dog.updateOne({_id: dogs[0]._id}, {gender: 'male'});
        console.log(`Updated ${dogs[0].name} to male`);
      }
      
      if (dogs.length > 1 && !dogs[1].gender) {
        await Dog.updateOne({_id: dogs[1]._id}, {gender: 'female'});
        console.log(`Updated ${dogs[1].name} to female`);
      }
    }
    
    console.log('Done updating. Now check your browser!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
})();