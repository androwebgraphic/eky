console.log('[WISHLIST DEBUG] userRoutes.js top');
console.log('[WISHLIST DEBUG] userRoutes.js loaded');
console.log('[WISHLIST DEBUG] Registering GET /wishlist route');

console.log('[ROUTES DEBUG] userRoutes.js loaded');
const express = require('express');
const multer = require('multer');
const { signupUser, loginUser, updateProfile, deleteProfile, addToWishlist, removeFromWishlist, getWishlist, requestPasswordReset, searchUsers, getUserById } = require('../controllers/userController.js');
const auth = require('../middleware/auth.js');


const router = express.Router();


// Wishlist routes (must be above /:id)
router.post('/wishlist', auth, addToWishlist);
router.delete('/wishlist/:dogId', auth, removeFromWishlist);
console.log('[ROUTES DEBUG] Registering GET /wishlist route with getWishlist handler');
console.log('[WISHLIST DEBUG] Before router.get(/wishlist)');
router.get('/wishlist', auth, getWishlist);
console.log('[WISHLIST DEBUG] After router.get(/wishlist)');

// Get user by ID (for chat block/unblock and profile fetch)
router.get('/:id', auth, getUserById);
router.get('/search', auth, searchUsers);

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});


router.post('/registracija', signupUser);
router.post('/logiranje', loginUser);
router.put('/profile', auth, upload.single('profilePicture'), updateProfile);
router.delete('/profile', auth, deleteProfile);
router.post('/password-reset', requestPasswordReset);


module.exports = router;