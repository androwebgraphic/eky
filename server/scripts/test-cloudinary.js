require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('=== Cloudinary Configuration Test ===');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');
console.log('');

// Test Cloudinary API
console.log('Testing Cloudinary API connection...');
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('❌ Cloudinary API connection failed:', error);
    process.exit(1);
  } else {
    console.log('✅ Cloudinary API connection successful!');
    console.log('Response:', result);
    process.exit(0);
  }
});