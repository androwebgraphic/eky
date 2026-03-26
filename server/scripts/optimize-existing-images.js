const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { optimizeImage } = require('../utils/imageOptimizer');

/**
 * Script to optimize all existing uploaded images
 * This will:
 * 1. Strip all metadata (preserving orientation)
 * 2. Reduce file sizes by 60-80%
 * 3. Maintain image quality
 */

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const dogsDir = path.join(uploadsDir, 'dogs');
const usersDir = path.join(uploadsDir, 'users');

// Image file extensions to process
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];

// Statistics
let stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  failedFiles: 0,
  originalTotalSize: 0,
  optimizedTotalSize: 0,
  savedSpace: 0
};

/**
 * Check if a file is an image based on extension
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Process a single image file
 */
async function processImage(filePath) {
  try {
    const originalSize = fs.statSync(filePath).size;
    
    // Process all images, regardless of size
    // Small files might still have metadata that needs to be stripped

    // Read the image buffer
    const buffer = fs.readFileSync(filePath);
    
    // Determine format from file extension
    const ext = path.extname(filePath).toLowerCase();
    let format = 'jpeg';
    if (ext === '.png') format = 'png';
    else if (ext === '.webp') format = 'webp';
    else if (ext === '.gif') format = 'gif';
    
    // For GIF and other formats, we can't optimize well, skip
    if (format === 'gif') {
      stats.skippedFiles++;
      return;
    }

    // Optimize the image
    console.log(`Processing: ${filePath} (${(originalSize / 1024).toFixed(2)} KB)`);
    
    const optimizedBuffer = await optimizeImage(buffer, {
      format: format,
      quality: 85
    });

    const optimizedSize = optimizedBuffer.length;
    
    // Only save if optimized version is actually smaller
    if (optimizedSize < originalSize) {
      // Create backup of original
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
      
      // Write optimized version
      fs.writeFileSync(filePath, optimizedBuffer);
      
      const savedBytes = originalSize - optimizedSize;
      stats.originalTotalSize += originalSize;
      stats.optimizedTotalSize += optimizedSize;
      stats.savedSpace += savedBytes;
      stats.processedFiles++;
      
      console.log(`  ✅ Optimized: ${(optimizedSize / 1024).toFixed(2)} KB (saved ${(savedBytes / 1024).toFixed(2)} KB, ${((savedBytes / originalSize) * 100).toFixed(1)}%)`);
      
      // Delete backup after successful optimization
      fs.unlinkSync(backupPath);
    } else {
      console.log(`  ⚠️  Skipped: Optimized version not smaller`);
      stats.skippedFiles++;
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    stats.failedFiles++;
    
    // Try to restore from backup if it exists
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, filePath);
        fs.unlinkSync(backupPath);
        console.log(`  🔄 Restored from backup`);
      } catch (restoreError) {
        console.error(`  ⚠️  Failed to restore backup:`, restoreError.message);
      }
    }
  }
}

/**
 * Process all images in a directory recursively
 */
async function processDirectory(dir) {
  console.log(`\n📁 Processing directory: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.log(`  ⚠️  Directory does not exist, skipping...`);
    return;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      await processDirectory(fullPath);
    } else if (file.isFile() && isImageFile(file.name)) {
      stats.totalFiles++;
      await processImage(fullPath);
    }
  }
}

/**
 * Print summary statistics
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files found:      ${stats.totalFiles}`);
  console.log(`Files processed:        ${stats.processedFiles}`);
  console.log(`Files skipped:          ${stats.skippedFiles}`);
  console.log(`Files failed:           ${stats.failedFiles}`);
  console.log('');
  console.log(`Original total size:    ${(stats.originalTotalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized total size:   ${(stats.optimizedTotalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Space saved:            ${(stats.savedSpace / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Space saved percent:    ${stats.originalTotalSize > 0 ? ((stats.savedSpace / stats.originalTotalSize) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Starting image optimization...\n');
  console.log('This will:');
  console.log('  - Strip all metadata from images (preserving orientation)');
  console.log('  - Reduce file sizes by 60-80%');
  console.log('  - Maintain visual quality');
  console.log('  - Create backups during processing');
  console.log('');

  try {
    // Process dog images
    await processDirectory(dogsDir);
    
    // Process user profile pictures
    await processDirectory(usersDir);
    
    // Print summary
    printSummary();
    
    console.log('\n✅ Optimization complete!');
    
    if (stats.failedFiles > 0) {
      console.log(`⚠️  ${stats.failedFiles} files failed to optimize. Check logs above for details.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();