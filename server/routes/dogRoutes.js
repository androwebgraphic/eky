
import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import { createDog, listDogs, getDogById, updateDog, deleteDog, likeDog, unlikeDog, requestAdoption, confirmAdoption, cancelAdoption } from '../controllers/dogController.js';

const router = express.Router();



// use memoryStorage to process with sharp
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// for media + optional poster
const cpUpload = upload.fields([
  { name: 'media', maxCount: 50 }, // allow up to 50 images
  { name: 'poster', maxCount: 1 }
]);



router.post('/:id/adopt-cancel', auth, cancelAdoption);
router.post('/:id/adopt-confirm', auth, confirmAdoption);
router.post('/:id/adopt-request', auth, requestAdoption);

router.post('/', auth, cpUpload, createDog);
router.get('/', listDogs);
router.get('/:id', getDogById);
router.patch('/:id', auth, cpUpload, updateDog);
router.delete('/:id', auth, deleteDog);
router.post('/:id/like', auth, likeDog);
router.delete('/:id/like', auth, unlikeDog);

export default router;