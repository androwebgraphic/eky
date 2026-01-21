import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageVariant(buffer, publicId, width) {
  return cloudinary.uploader.upload_stream({
    public_id: publicId,
    transformation: [{ width, crop: 'scale' }],
    resource_type: 'image',
    overwrite: true,
  });
}

export default cloudinary;
