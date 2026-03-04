const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth.js');
const authMiddleware = auth;
const { isAdmin, isSuperAdmin } = auth;
const { createDog, getDogById, updateDog, deleteDog, likeDog, unlikeDog, confirmAdoption, getPendingAdoptions, listDogs, cancelAdoption, adoptRequest, getNewDogsSince } = require('../controllers/dogController.js');
console.log('dogController:', { createDog, getDogById, updateDog, deleteDog, likeDog, unlikeDog, confirmAdoption, getPendingAdoptions, listDogs, cancelAdoption, adoptRequest, getNewDogsSince });
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






// Specific routes first (must come before /:id routes)
router.get('/', listDogs);
router.get('/new-since/:lastVisit', authMiddleware, getNewDogsSince);
router.post('/', authMiddleware, cpUpload, createDog);
router.post('/confirm-adoption', authMiddleware, confirmAdoption);
router.get('/pending-adoptions', authMiddleware, getPendingAdoptions);

// Superadmin routes - can manage any adoption
router.post('/superadmin/adopt-confirm/:id', authMiddleware, async (req, res) => {
  const { isAdmin, isSuperAdmin } = require('../middleware/auth.js');
  if (!isAdmin(req.user) && !isSuperAdmin(req.user)) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  return confirmAdoption(req, res);
});
router.post('/superadmin/adopt-cancel/:id', authMiddleware, async (req, res) => {
  const { isAdmin, isSuperAdmin } = require('../middleware/auth.js');
  if (!isAdmin(req.user) && !isSuperAdmin(req.user)) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  return cancelAdoption(req, res);
});

// Parameterized routes
router.post('/:id/adopt-confirm', authMiddleware, confirmAdoption);
router.post('/:id/adopt-cancel', authMiddleware, async (req, res) => {
  console.log('[ROUTE DEBUG] /:id/adopt-cancel route matched for dogId:', req.params.id);
  console.log('[ROUTE DEBUG] req.user:', req.user);
  console.log('[ROUTE DEBUG] req.user._id:', req.user._id);
  console.log('[ROUTE DEBUG] req.user.role:', req.user.role);
  console.log('[ROUTE DEBUG] About to call cancelAdoption...');
  
  try {
    return await cancelAdoption(req, res);
  } catch (error) {
    console.error('[ROUTE DEBUG] Error in route handler:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Server error in route handler', error: error.message });
    }
  }
});
router.post('/:id/adopt-request', authMiddleware, adoptRequest);
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