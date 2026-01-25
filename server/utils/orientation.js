// utils/orientation.js
// Reads EXIF orientation and returns sharp transformation options
import exif from 'exif-reader';

export function getOrientationTransform(buffer) {
  let orientation = 1;
  try {
    // JPEG: EXIF starts after 2 bytes (FF D8)
    let start = 0;
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      start = 2;
    }
    const data = buffer.slice(start);
    const exifData = require('exif-reader')(require('jpeg-js').decode(buffer, true).exif);
    orientation = exifData && exifData.image && exifData.image.Orientation ? exifData.image.Orientation : 1;
  } catch (e) {
    // fallback: orientation 1
  }
  // Map EXIF orientation to sharp transforms
  // https://magnushoff.com/articles/jpeg-orientation/
  switch (orientation) {
    case 2: return { flip: true };
    case 3: return { rotate: 180 };
    case 4: return { flop: true };
    case 5: return { rotate: 90, flip: true };
    case 6: return { rotate: 90 };
    case 7: return { rotate: 270, flip: true };
    case 8: return { rotate: 270 };
    default: return {};
  }
}
