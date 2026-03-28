const mongoose = require('mongoose');

const mediaVariantSchema = new mongoose.Schema({
  url: { type: String, required: true },
  width: Number,
  height: Number,
  size: String
}, { _id: false });

const dogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: String,
  age: Number,
  color: String,
  location: String,
  description: String,
  // Geographic coordinates for distance calculations
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [longitude, latitude] in GeoJSON format
    }
  },
  size: { type: String, enum: ['small','medium','large'], default: 'large' },
  gender: { type: String, enum: ['male', 'female'] },
  vaccinated: { type: Boolean, default: false },
  neutered: { type: Boolean, default: false },
  images: [mediaVariantSchema], // multiple variants for responsive images
  video: {
    url: String,
    poster: [mediaVariantSchema]
  },
  // server-side tiny thumbnail (64px) for fast list display
  thumbnail: mediaVariantSchema,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
  ,adoptionStatus: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  },
  adoptionQueue: {
    adopter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ownerConfirmed: { type: Boolean, default: false },
    adopterConfirmed: { type: Boolean, default: false }
  }
});

const Dog = mongoose.model('Dog', dogSchema);

// Create 2dsphere index for geospatial queries
Dog.collection.createIndex({ coordinates: '2dsphere' }).catch(err => {
  if (err.code !== 86) { // Ignore "Index already exists" error
    console.warn('[DOG MODEL] Failed to create geospatial index:', err);
  }
});

module.exports = Dog;
