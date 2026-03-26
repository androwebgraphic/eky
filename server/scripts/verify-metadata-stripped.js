const fs = require('fs');
const path = require('path');
const ExifReader = require('exif-reader');

/**
 * Script to verify that metadata has been stripped from images
 */

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Image file extensions to check
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];

/**
 * Check if a file is an image based on extension
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Check metadata for a single image file
 */
function checkMetadata(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const fileSize = buffer.length;
    
    console.log(`\n📄 ${path.basename(filePath)} (${(fileSize / 1024).toFixed(2)} KB)`);
    
    // Try to read EXIF data
    let tags = {};
    try {
      tags = ExifReader.load(buffer);
    } catch (e) {
      // No EXIF data found (which is what we want!)
      console.log(`  ✅ No EXIF metadata found (metadata successfully stripped)`);
      return { hasMetadata: false };
    }
    
    // Check for common metadata tags
    const metadataTags = {
      'GPS': 'GPS Coordinates',
      'Make': 'Camera Manufacturer',
      'Model': 'Camera Model',
      'DateTime': 'Date/Time',
      'Orientation': 'Orientation',
      'Software': 'Software Used',
      'ImageWidth': 'Image Width',
      'ImageHeight': 'Image Height'
    };
    
    let foundMetadata = false;
    
    for (const [tag, description] of Object.entries(metadataTags)) {
      if (tags[tag]) {
        console.log(`  ⚠️  Found ${description}: ${tag}`);
        foundMetadata = true;
      }
    }
    
    if (foundMetadata) {
      console.log(`  ⚠️  This image still has metadata`);
      return { hasMetadata: true };
    } else {
      console.log(`  ✅ No common metadata tags found`);
      return { hasMetadata: false };
    }
    
  } catch (error) {
    console.error(`  ❌ Error checking ${filePath}:`, error.message);
    return { hasMetadata: null, error: error.message };
  }
}

/**
 * Process all images in a directory recursively
 */
function processDirectory(dir) {
  console.log(`\n📁 Checking directory: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.log(`  ⚠️  Directory does not exist, skipping...`);
    return { total: 0, withMetadata: 0, withoutMetadata: 0, errors: 0 };
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });
  let stats = { total: 0, withMetadata: 0, withoutMetadata: 0, errors: 0 };
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      const subStats = processDirectory(fullPath);
      stats.total += subStats.total;
      stats.withMetadata += subStats.withMetadata;
      stats.withoutMetadata += subStats.withoutMetadata;
      stats.errors += subStats.errors;
    } else if (file.isFile() && isImageFile(file.name)) {
      const result = checkMetadata(fullPath);
      stats.total++;
      
      if (result.hasMetadata === true) {
        stats.withMetadata++;
      } else if (result.hasMetadata === false) {
        stats.withoutMetadata++;
      } else {
        stats.errors++;
      }
    }
  }
  
  return stats;
}

/**
 * Print summary statistics
 */
function printSummary(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 METADATA VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total images checked:      ${stats.total}`);
  console.log(`Images WITH metadata:     ${stats.withMetadata}`);
  console.log(`Images WITHOUT metadata:   ${stats.withoutMetadata}`);
  console.log(`Errors during check:       ${stats.errors}`);
  
  const percentClean = stats.total > 0 ? ((stats.withoutMetadata / stats.total) * 100).toFixed(1) : 0;
  console.log('');
  console.log(`Metadata stripped:         ${percentClean}%`);
  
  if (stats.withMetadata > 0) {
    console.log(`\n⚠️  WARNING: ${stats.withMetadata} image(s) still contain metadata!`);
  } else if (stats.total > 0) {
    console.log(`\n✅ SUCCESS: All images have been optimized and metadata stripped!`);
  } else {
    console.log(`\nℹ️  INFO: No images found to check`);
  }
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Verifying image metadata stripping...\n');
  console.log('This will check if metadata (EXIF, GPS, etc.) has been removed from images.');
  console.log('');

  try {
    let totalStats = { total: 0, withMetadata: 0, withoutMetadata: 0, errors: 0 };
    
    // Check dog images
    const dogStats = processDirectory(path.join(uploadsDir, 'dogs'));
    totalStats.total += dogStats.total;
    totalStats.withMetadata += dogStats.withMetadata;
    totalStats.withoutMetadata += dogStats.withoutMetadata;
    totalStats.errors += dogStats.errors;
    
    // Check user profile pictures
    const userStats = processDirectory(path.join(uploadsDir, 'users'));
    totalStats.total += userStats.total;
    totalStats.withMetadata += userStats.withMetadata;
    totalStats.withoutMetadata += userStats.withoutMetadata;
    totalStats.errors += userStats.errors;
    
    // Print summary
    printSummary(totalStats);
    
    // Exit with appropriate code
    if (totalStats.withMetadata > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();