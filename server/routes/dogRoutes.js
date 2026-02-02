const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth.js');
const authMiddleware = auth;
const { isAdmin, isSuperAdmin } = auth;
const { createDog, getDogById, updateDog, deleteDog, likeDog, unlikeDog, confirmAdoption, getPendingAdoptions, listDogs, cancelAdoption, adoptRequest } = require('../controllers/dogController.js');
console.log('dogController:', { createDog, getDogById, updateDog, deleteDog, likeDog, unlikeDog, confirmAdoption, getPendingAdoptions, listDogs, cancelAdoption, adoptRequest });
const router = express.Router();

// Remove PATCH route without cpUpload (multer)


// use memoryStorage to process with sharp
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

// for media + optional poster
const cpUpload = upload.fields([
  { name: 'media', maxCount: 50 }, // allow up to 50 images
  { name: 'poster', maxCount: 1 }
]);






router.post('/:id/adopt-confirm', authMiddleware, confirmAdoption);
router.post('/confirm-adoption', authMiddleware, confirmAdoption); // New route for body-based confirm
router.get('/pending-adoptions', authMiddleware, getPendingAdoptions);
router.post('/:id/adopt-cancel', authMiddleware, cancelAdoption);
router.post('/:id/adopt-request', authMiddleware, adoptRequest);

router.post('/', authMiddleware, cpUpload, createDog);
router.get('/', listDogs); // List all dogs
router.get('/:id', getDogById);
router.patch('/:id', authMiddleware, cpUpload, updateDog);
router.delete('/:id', authMiddleware, deleteDog);
router.post('/:id/like', authMiddleware, likeDog);
router.delete('/:id/like', authMiddleware, unlikeDog);

// TEST-ONLY: Manual dog deletion for debugging
router.post('/:id/test-delete', authMiddleware, async (req, res) => {
  const { isAdmin, isSuperAdmin } = require('../middleware/auth.js');
  if (!isAdmin(req.user) && !isSuperAdmin(req.user)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const dogId = req.params.id;
  const Dog = require('../models/dogModel');
  console.log(`[TEST DELETE] Attempting to delete dogId: ${dogId}`);
  const deletedDog = await Dog.findByIdAndDelete(dogId);
  if (deletedDog) {
    console.log(`[TEST DELETE] Dog deleted:`, deletedDog);
    return res.json({ message: 'Dog deleted', deleted: true, dogId });
  } else {
    const stillExists = await Dog.findById(dogId);
    if (stillExists) {
      console.error(`[TEST DELETE] Dog still exists in DB:`, stillExists);
      return res.json({ message: 'Dog not deleted, still exists', deleted: false, dogId });
    } else {
      console.error(`[TEST DELETE] Dog not found after failed delete.`);
      return res.json({ message: 'Dog not found', deleted: false, dogId });
    }
  }
});

module.exports = router;