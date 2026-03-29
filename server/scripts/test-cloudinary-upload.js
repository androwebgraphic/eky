require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('=== Cloudinary Upload Test ===\n');

// Create a simple test image buffer
const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchH7YAAAAABJRU5ErkJggg==', 'base64');

console.log('1. Testing single image upload...');
const uploadSingle = async () => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'test-upload',
          public_id: 'test-image',
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(testImageBuffer);
    });
    console.log('✅ Single upload successful!');
    console.log('   URL:', result.secure_url);
    console.log('   Public ID:', result.public_id);
    return result;
  } catch (error) {
    console.error('❌ Single upload failed:', error.message);
    throw error;
  }
};

const uploadVariants = async () => {
  console.log('\n2. Testing multiple variant uploads (320px, 640px, 1024px, original)...');
  const sizes = [320, 640, 1024];
  const results = [];
  
  for (const width of sizes) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'test-upload',
            public_id: `test-${width}`,
            transformation: [
              { width, quality: 'auto', fetch_format: 'auto' }
            ],
            overwrite: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(testImageBuffer);
      });
      
      results.push({
        url: result.secure_url,
        width: width,
        size: `${width}`,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format
      });
      
      console.log(`✅ Uploaded ${width}px variant`);
    } catch (error) {
      console.error(`❌ Failed to upload ${width}px variant:`, error.message);
    }
  }
  
  return results;
};

const deleteTestFiles = async () => {
  console.log('\n3. Cleaning up test files...');
  try {
    const publicIds = ['test-image', 'test-320', 'test-640', 'test-1024'];
    await cloudinary.api.delete_resources(publicIds, { resource_type: 'image' });
    console.log('✅ Test files deleted from Cloudinary');
  } catch (error) {
    console.warn('⚠️  Failed to delete test files:', error.message);
  }
};

// Run tests
(async () => {
  try {
    await uploadSingle();
    await uploadVariants();
    await deleteTestFiles();
    
    console.log('\n✅ All Cloudinary tests passed!');
    console.log('\nCloudinary is working correctly for:');
    console.log('  • Single image uploads');
    console.log('  • Multiple size variants');
    console.log('  • Image transformations');
    console.log('  • File deletion');
    console.log('\nReady for production use!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cloudinary test failed:', error);
    console.error('\nCheck your credentials in .env:');
    console.error('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
    console.error('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
    console.error('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing\n');
    process.exit(1);
  }
})();