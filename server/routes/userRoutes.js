console.log('[WISHLIST DEBUG] userRoutes.js top');
console.log('[WISHLIST DEBUG] userRoutes.js loaded');
console.log('[WISHLIST DEBUG] Registering GET /wishlist route');

console.log('[ROUTES DEBUG] userRoutes.js loaded');
const express = require('express');
const multer = require('multer');
const User = require('../models/userModel');
const { signupUser, loginUser, updateProfile, deleteProfile, addToWishlist, removeFromWishlist, getWishlist, requestPasswordReset, searchUsers, getUserById, getAllUsers, updateLastVisit } = require('../controllers/userController.js');
const auth = require('../middleware/auth.js');
const { isAdmin, isSuperAdmin } = auth;

const router = express.Router();

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

// Public routes
router.post('/registracija', signupUser);
router.post('/logiranje', loginUser);
router.post('/password-reset', requestPasswordReset);

// Wishlist routes (must be above /:id)
router.post('/wishlist', auth, addToWishlist);
router.delete('/wishlist/:dogId', auth, removeFromWishlist);
console.log('[ROUTES DEBUG] Registering GET /wishlist route with getWishlist handler');
console.log('[WISHLIST DEBUG] Before router.get(/wishlist)');
router.get('/wishlist', auth, getWishlist);
console.log('[WISHLIST DEBUG] After router.get(/wishlist)');

// Other specific routes (must be above /:id)
router.get('/search', auth, searchUsers);
router.put('/last-visit', auth, updateLastVisit);

// Superadmin routes for managing all users
router.get('/all', auth, isSuperAdmin, getAllUsers);

// Get current user data
router.get('/me', auth, async (req, res) => {
  try {
    console.log('[/ME ENDPOINT] Fetching user data for:', req.user._id);
    const user = await User.findById(req.user._id).select('-password');
    console.log('[/ME ENDPOINT] User found:', user ? 'YES' : 'NO');
    console.log('[/ME ENDPOINT] User role:', user?.role);
    res.json(user);
  } catch (error) {
    console.error('[/ME ENDPOINT] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// User's own profile routes
router.put('/profile', auth, upload.single('profilePicture'), updateProfile);
router.delete('/profile', auth, deleteProfile);

// Superadmin routes for managing other users
router.get('/:id', auth, getUserById);
router.put('/:id/profile', auth, upload.single('profilePicture'), updateProfile);
router.delete('/:id/profile', auth, isSuperAdmin, deleteProfile);

module.exports = router;