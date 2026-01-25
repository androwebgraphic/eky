// Script to reprocess all existing dog images in uploads/dogs/ to match current logic (no rotation, no EXIF changes)
// Usage: node reprocess_dog_images.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DOGS_UPLOADS = path.join(__dirname, '../uploads/dogs');

const SIZES = [320, 640, 1024];
const THUMB_SIZE = 64;

function isImageFile(filename) {
  return /\.(jpg|jpeg|png)$/i.test(filename);
}

async function reprocessDogImages(dogDir) {
  const files = fs.readdirSync(dogDir).filter(f => isImageFile(f) && !f.startsWith('thumb-'));
  if (files.length === 0) return;
  // Use the first image as the "original" for reprocessing
  const origFile = files[0];
  const origPath = path.join(dogDir, origFile);
  const baseName = path.parse(origFile).name;
  // 1. Resized variants
  for (const w of SIZES) {
    const outName = `${baseName}-${w}.jpg`;
    const outPath = path.join(dogDir, outName);
    const buffer = await sharp(origPath)
      .resize({ width: w })
      .jpeg({ quality: 90 })
      .toBuffer();
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved: ${outPath}`);
  }
  // 2. Original (EXIF stripped)
  const origNoExifName = `${baseName}-orig.jpg`;
  const origNoExifPath = path.join(dogDir, origNoExifName);
  const origNoExifBuffer = await sharp(origPath)
    .withMetadata({ exif: undefined })
    .jpeg({ quality: 90 })
    .toBuffer();
  fs.writeFileSync(origNoExifPath, origNoExifBuffer);
  console.log(`Saved: ${origNoExifPath}`);
  // 3. Thumbnail (64px)
  const thumbName = 'thumb-64.jpg';
  const thumbPath = path.join(dogDir, thumbName);
  const thumbBuffer = await sharp(origPath)
    .resize({ width: THUMB_SIZE })
    .jpeg({ quality: 70 })
    .toBuffer();
  fs.writeFileSync(thumbPath, thumbBuffer);
  console.log(`Saved: ${thumbPath}`);
}

async function main() {
  const dogIds = fs.readdirSync(DOGS_UPLOADS).filter(f => fs.statSync(path.join(DOGS_UPLOADS, f)).isDirectory());
  for (const dogId of dogIds) {
    const dogDir = path.join(DOGS_UPLOADS, dogId);
    await reprocessDogImages(dogDir);
  }
  console.log('Reprocessing complete.');
}

main();
