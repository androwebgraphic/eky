import express from "express";
import multer from 'multer';
import { signupUser, loginUser, updateProfile, deleteProfile, addToWishlist, removeFromWishlist, getWishlist, requestPasswordReset, searchUsers, getUserById } from "../controllers/userController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get user by ID (for chat block/unblock and profile fetch)
router.get(":id", auth, getUserById);
router.get("/search", auth, searchUsers);

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

router.post("/registracija", signupUser);
router.post("/logiranje", loginUser);
router.put("/profile", auth, upload.single('profilePicture'), updateProfile);
router.delete("/profile", auth, deleteProfile);
router.post("/password-reset", requestPasswordReset);
router.post("/wishlist", auth, addToWishlist);
router.delete("/wishlist/:dogId", auth, removeFromWishlist);
router.get("/wishlist", auth, getWishlist);

export default router;