# Cloudinary Setup Guide for Dog Adoption App

## How Cloudinary Works for Multi-User Apps

**You only need ONE Cloudinary account for the entire app.** Here's how it works:

1. **Server-Side Upload**: Your server has Cloudinary API credentials (stored in `.env` files)
2. **User Upload Flow**: When a user uploads a dog image through your app:
   - User uploads the image to your server (via the upload endpoint)
   - Your server uses the Cloudinary API to upload it to your Cloudinary account
   - Your server saves the Cloudinary URL in your database with the dog/user reference
3. **No User Accounts Needed**: Users never interact with Cloudinary directly - they only use your app's interface

## Benefits of This Approach

- **Security**: Your Cloudinary API keys stay on the server, never exposed to users
- **Control**: You control all images, can moderate them, organize them with tags
- **Cost**: One billing account, easy to manage
- **Scalability**: Works whether you have 1 user or 1 million users

## Organization in Cloudinary

Images are organized using:
- **Folders**: `/dogs/{userId}/{dogId}/`
- **Tags**: `user:{userId}`, `dog:{dogId}`, `video`, `size:320`, `size:640`, `size:1024`
- **Public IDs**: Include user/dog info in the image ID for easy reference

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to https://cloudinary.com and sign up
2. Choose the free tier (up to 25GB storage, 25GB bandwidth/month)
3. After signup, you'll get your Dashboard

### 2. Get Your Cloudinary Credentials

From your Cloudinary Dashboard:
1. Click on the Dashboard tab
2. Note down:
   - **Cloud name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `AbCdEfGhIjKlMnOpQrStUvWxYz`)

### 3. Add Credentials to Your Environment

Edit your `server/.env` file and add:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important**: Never commit `.env` files to version control! Use `.env.example` as a template.

### 4. Restart Your Server

After adding the credentials, restart your Node.js server:

```bash
cd /Applications/MAMP/htdocs/eky/server
npm run dev
```

## What Has Been Implemented

### New Files Created

1. **`server/config/cloudinary.js`** - Cloudinary configuration and helper functions
   - `uploadImageToCloudinary()` - Upload single image
   - `uploadImageVariants()` - Upload multiple sizes (320px, 640px, 1024px)
   - `uploadVideoToCloudinary()` - Upload videos
   - `deleteFromCloudinary()` - Delete single file
   - `deleteMultipleFromCloudinary()` - Delete multiple files
   - `deleteFolder()` - Delete entire folder

2. **`server/.env.example`** - Updated with Cloudinary variables

### Updated Files

1. **`server/controllers/dogController.js`** - Updated `createDog()` to use Cloudinary
   - Images now uploaded to Cloudinary instead of local filesystem
   - Videos uploaded to Cloudinary
   - Automatic creation of multiple image sizes
   - Thumbnails generated and uploaded to Cloudinary

2. **`server/package.json`** - Added `cloudinary` dependency

## Image Storage Structure

When a user creates a new dog, images are stored in Cloudinary like this:

```
dogs/
  └── {dogId}/
      ├── img-0-{timestamp}-{random}-320.jpg    (320px width)
      ├── img-0-{timestamp}-{random}-640.jpg    (640px width)
      ├── img-0-{timestamp}-{random}-1024.jpg   (1024px width)
      ├── img-0-{timestamp}-{random}-orig.jpg    (original size)
      ├── thumb-64.jpg                              (64px thumbnail)
      ├── video-0.mp4                              (if video uploaded)
      └── poster-0-{timestamp}-{random}-*.jpg   (video poster images)
```

## Database Schema Changes

The dog document in MongoDB now stores:

```javascript
{
  images: [
    {
      url: "https://res.cloudinary.com/your-cloud/image/upload/v123/dogs/abc123/img-0-...",
      width: 320,
      size: "320",
      publicId: "dogs/abc123/img-0-...",
      resourceType: "image",
      format: "jpg"
    },
    // ... more variants
  ],
  thumbnail: {
    url: "https://res.cloudinary.com/your-cloud/image/upload/...",
    publicId: "dogs/abc123/thumb-64",
    width: 64,
    size: "64"
  },
  video: {
    url: "https://res.cloudinary.com/your-cloud/video/upload/...",
    publicId: "dogs/abc123/video-0",
    resourceType: "video",
    format: "mp4",
    poster: [
      // poster image variants
    ]
  }
}
```

## Migration Strategy for Existing Images

Since your app currently has images stored locally, you have two options:

### Option 1: Gradual Migration (Recommended)
- Keep existing local images as they are
- New images uploaded via Cloudinary
- Update dog records individually as needed
- This ensures no downtime and gradual transition

### Option 2: Bulk Migration
Create a migration script to upload all existing local images to Cloudinary. This would:
1. Iterate through all dogs
2. Download local images
3. Upload to Cloudinary
4. Update database with Cloudinary URLs
5. Delete local files

**Note**: A migration script can be created when you're ready.

## Testing the Integration

### Test Creating a New Dog

1. Add Cloudinary credentials to `server/.env`
2. Restart the server
3. Create a new dog with images
4. Check the response - you should see Cloudinary URLs
5. Verify in Cloudinary Dashboard that images appear in the `dogs/` folder

### Expected Behavior

- Images are uploaded immediately to Cloudinary
- Multiple sizes are created automatically
- Thumbnails are generated
- No files are stored locally in `uploads/` directory
- All image URLs are HTTPS secure URLs

## Cloudinary Features Available

Once integrated, you can use Cloudinary's powerful features:

### 1. On-the-Fly Transformations
```javascript
// Generate different sizes dynamically
https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300/dogs/abc123/image.jpg

// Apply filters
https://res.cloudinary.com/your-cloud/image/upload/e_grayscale/dogs/abc123/image.jpg

// Crop and focus on face
https://res.cloudinary.com/your-cloud/image/upload/c_thumb,g_face,w_200,h_200/dogs/abc123/image.jpg
```

### 2. Automatic Optimization
Cloudinary automatically:
- Compresses images
- Converts to optimal format (WebP, AVIF)
- Delivers from CDN for fast loading
- Handles mobile responsiveness

### 3. Video Streaming
- Adaptive bitrate streaming
- Multiple quality options
- Subtitle support
- Thumbnail generation

### 4. AI-Powered Features
- Auto-tagging
- Face detection
- Content moderation
- Background removal (paid feature)

## Cost Considerations

### Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 GB/month
- **Number of images**: Unlimited

### When to Upgrade
- Storage exceeds 25 GB
- Monthly bandwidth exceeds 25 GB
- Need advanced AI features
- Need dedicated support

### Estimated Costs for Your App
Assuming:
- 100 dogs with 4 images each (400 images)
- Each image: 2 MB (after optimization)
- 1000 page views/day showing 4 images each

**Storage**: 400 × 2 MB = 800 MB (well under free tier)
**Bandwidth**: 1000 × 4 × 2 MB = 8 GB/day = 240 GB/month

⚠️ **You'll need to upgrade the free tier** if you expect 1000+ daily page views with images.

## Troubleshooting

### Error: "Invalid credentials"
- Check that all three credentials are in `.env`
- Ensure no extra spaces in values
- Verify credentials match Cloudinary Dashboard

### Error: "Upload limit exceeded"
- Check Cloudinary Dashboard for usage
- Consider upgrading plan or optimizing images further

### Error: "Folder not found"
- Cloudinary creates folders automatically
- Check your cloud name is correct

### Images not appearing
- Check server logs for upload errors
- Verify network connectivity
- Check Cloudinary Dashboard > Media Library

## Security Best Practices

1. **Never expose API secret** - It's only used server-side
2. **Use signed uploads** for additional security (implemented)
3. **Enable transformation restrictions** in Cloudinary settings
4. **Monitor usage** regularly in Cloudinary Dashboard
5. **Set up alerts** for unusual activity

## Next Steps

1. ✅ Add Cloudinary credentials to `server/.env`
2. ✅ Restart the server
3. ✅ Test creating a new dog with images
4. ✅ Verify images appear in Cloudinary Dashboard
5. ⏸️ (Optional) Create migration script for existing images
6. ⏸️ (Optional) Implement Cloudinary for user profile images

## Support Resources

- Cloudinary Documentation: https://cloudinary.com/documentation
- Node.js SDK: https://cloudinary.com/documentation/node_integration
- Dashboard: https://cloudinary.com/console

---

**Summary**: Your app now uses Cloudinary for image storage. Users don't need Cloudinary accounts - your single server account handles all uploads, providing security, control, and scalability.