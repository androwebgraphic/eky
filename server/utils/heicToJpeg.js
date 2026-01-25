// heicToJpeg.js
// Uses 'heic-convert' to convert HEIC/HEIF buffer to JPEG buffer
import heicConvert from 'heic-convert';

export async function heicBufferToJpeg(buffer) {
  try {
    const outputBuffer = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 1 // max quality
    });
    return outputBuffer;
  } catch (err) {
    console.warn('[HEIC/HEIF] heic-convert failed:', err);
    throw err;
  }
}
