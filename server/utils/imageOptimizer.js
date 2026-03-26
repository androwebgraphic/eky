const sharp = require('sharp');

/**
 * Optimize image by stripping all metadata except orientation
 * This reduces file size while maintaining proper image display
 * 
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {Object} options - Optimization options
 * @param {number} options.width - Target width (optional)
 * @param {number} options.height - Target height (optional)
 * @param {string} options.format - Output format ('jpeg' or 'png')
 * @param {number} options.quality - Quality (1-100 for jpeg, 0-9 for png)
 * @returns {Promise<Buffer>} Optimized image buffer
 */
async function optimizeImage(imageBuffer, options = {}) {
  const {
    width,
    height,
    format = 'jpeg',
    quality = 85
  } = options;

  let sharpInstance = sharp(imageBuffer);

  // Auto-rotate based on EXIF orientation (this strips orientation metadata)
  // This ensures the image is displayed correctly without needing orientation tags
  sharpInstance = sharpInstance.rotate();

  // Resize if dimensions specified
  if (width || height) {
    sharpInstance = sharpInstance.resize({ 
      width, 
      height,
      fit: 'cover',
      position: 'center',
      fastShrinkOnLoad: true
    });
  }

  // Format-specific optimization
  // Note: We DON'T use withMetadata() to strip all EXIF data
  // The rotate() call has already handled orientation
  if (format === 'jpeg') {
    // Progressive JPEG for faster loading on slow connections
    // Quality 85 provides good balance between size and visual quality
    sharpInstance = sharpInstance.jpeg({ 
      quality,
      progressive: true,
      mozjpeg: true // Use mozjpeg encoder for better compression
    });
  } else if (format === 'png') {
    // PNG optimization: compression level 6-8 provides good balance
    // Quality 85 maps to compression level ~6
    const compressionLevel = Math.floor((100 - quality) / 10) + 2;
    sharpInstance = sharpInstance.png({ 
      compressionLevel: Math.min(compressionLevel, 9),
      adaptiveFiltering: true,
      palette: false
    });
  }

  return sharpInstance.toBuffer();
}

/**
 * Optimize and create multiple variants of an image
 * 
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {Array<number>} widths - Array of widths for variants
 * @param {Object} options - Optimization options
 * @returns {Promise<Array<{width: number, buffer: Buffer}>>} Array of optimized variants
 */
async function createOptimizedVariants(imageBuffer, widths, options = {}) {
  const variants = [];
  
  for (const w of widths) {
    const buffer = await optimizeImage(imageBuffer, {
      ...options,
      width: w
    });
    variants.push({ width: w, buffer });
  }
  
  return variants;
}

module.exports = {
  optimizeImage,
  createOptimizedVariants
};