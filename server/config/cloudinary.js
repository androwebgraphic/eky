const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS
});

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageBuffer, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: options.folder || 'dogs',
        public_id: options.publicId,
        transformation: options.transformation || [],
        tags: options.tags || [],
        overwrite: true
      },
      (error, result) => {
        if (error) throw error;
        return result;
      }
    );

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: options.folder || 'dogs',
          public_id: options.publicId,
          transformation: options.transformation || [],
          tags: options.tags || [],
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(imageBuffer);
    });
  } catch (error) {
    console.error('[CLOUDINARY] Upload error:', error);
    throw error;
  }
};

// Helper function to upload multiple image variants
const uploadImageVariants = async (imageBuffer, baseName, folder) => {
  const variants = [];
  const sizes = [320, 640, 1024];
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);

  try {
    // Upload optimized variants at different sizes
    for (const width of sizes) {
      const publicId = `${baseName}-${timestamp}-${randomSuffix}-${width}`;
      const result = await uploadImageToCloudinary(imageBuffer, {
        folder,
        publicId,
        transformation: [
          { width, quality: 'auto', fetch_format: 'auto' }
        ],
        tags: [`size:${width}`]
      });
      
      variants.push({
        url: result.secure_url,
        width: width,
        size: `${width}`,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format
      });
    }

    // Upload original image
    const originalPublicId = `${baseName}-${timestamp}-${randomSuffix}-orig`;
    const originalResult = await uploadImageToCloudinary(imageBuffer, {
      folder,
      publicId: originalPublicId,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ],
      tags: ['original']
    });

    variants.push({
      url: originalResult.secure_url,
      width: null,
      size: 'orig',
      publicId: originalResult.public_id,
      resourceType: originalResult.resource_type,
      format: originalResult.format
    });

    return variants;
  } catch (error) {
    console.error('[CLOUDINARY] Variant upload error:', error);
    throw error;
  }
};

// Helper function to upload video to Cloudinary
const uploadVideoToCloudinary = async (videoBuffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: options.folder || 'dogs',
          public_id: options.publicId,
          transformation: options.transformation || [],
          tags: options.tags || [],
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(videoBuffer);
    });
  } catch (error) {
    console.error('[CLOUDINARY] Video upload error:', error);
    throw error;
  }
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true // Invalidate CDN cache
    });
    console.log('[CLOUDINARY] Delete result:', result);
    return result;
  } catch (error) {
    console.error('[CLOUDINARY] Delete error:', error);
    throw error;
  }
};

// Helper function to delete multiple files by public IDs
const deleteMultipleFromCloudinary = async (publicIds, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
      invalidate: true
    });
    console.log('[CLOUDINARY] Multiple delete result:', result);
    return result;
  } catch (error) {
    console.error('[CLOUDINARY] Multiple delete error:', error);
    throw error;
  }
};

// Helper function to delete an entire folder from Cloudinary
const deleteFolder = async (folderPath) => {
  try {
    // Get all resources in the folder
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: 500
    });

    if (resources.resources.length > 0) {
      const publicIds = resources.resources.map(r => r.public_id);
      await deleteMultipleFromCloudinary(publicIds, 'image');
    }

    // Get all videos in the folder
    const videos = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      prefix: folderPath,
      max_results: 500
    });

    if (videos.resources.length > 0) {
      const videoIds = videos.resources.map(v => v.public_id);
      await deleteMultipleFromCloudinary(videoIds, 'video');
    }

    console.log(`[CLOUDINARY] Deleted folder ${folderPath} and all its contents`);
    return { success: true };
  } catch (error) {
    console.error('[CLOUDINARY] Folder delete error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImageToCloudinary,
  uploadImageVariants,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  deleteFolder
};