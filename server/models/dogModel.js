import mongoose from 'mongoose';

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
  size: { type: String, enum: ['small','medium','large'], default: 'medium' },
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
});

const Dog = mongoose.model('Dog', dogSchema);
export default Dog;