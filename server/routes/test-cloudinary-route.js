const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Test endpoint to verify Cloudinary configuration
router.get('/test-cloudinary', (req, res) => {
  const cloudConfig = cloudinary.config();
  
  res.json({
    cloudinaryConfigured: !!(cloudConfig.cloud_name && cloudConfig.api_key && cloudConfig.api_secret),
    cloudName: cloudConfig.cloud_name ? '✅ Set' : '❌ Missing',
    apiKey: cloudConfig.api_key ? '✅ Set' : '❌ Missing',
    apiSecret: cloudConfig.api_secret ? '✅ Set' : '❌ Missing',
    environment: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Set (hidden)' : '❌ Missing'
    }
  });
});

module.exports = router;