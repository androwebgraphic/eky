import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://andreassklizovic:jl31156l@eky.zw3yij8.mongodb.net/eky?retryWrites=true&w=majority';

const dogSchema = new mongoose.Schema({
  name: String,
  breed: String,
  age: Number,
  color: String,
  location: String,
  description: String,
  size: String,
  gender: String,
  vaccinated: Boolean,
  neutered: Boolean,
  images: Array,
  video: Object,
  thumbnail: Object,
  user: mongoose.Schema.Types.ObjectId,
  likes: Array,
  createdAt: Date,
  adoptionStatus: String,
  adoptionQueue: Object
});

const Dog = mongoose.model('Dog', dogSchema);

async function deleteAllDogs() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const result = await Dog.deleteMany({});
    console.log(`Deleted ${result.deletedCount} dogs.`);
  } catch (err) {
    console.error('Error deleting dogs:', err);
  } finally {
    await mongoose.disconnect();
  }
}

deleteAllDogs();