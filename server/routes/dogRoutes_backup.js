import express from 'express';
import multer from 'multer';
import { createDog, listDogs, updateDog, deleteDog } from '../controllers/dogController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// use memoryStorage to process with sharp
const storage = multer.memoryStorage();
const upload = multer({ storage });

// for media + optional poster
const cpUpload = upload.fields([
  { name: 'media', maxCount: 20 }, // allow up to 20 images
  { name: 'poster', maxCount: 1 }
]);


router.post('/', auth, cpUpload, createDog);
router.get('/', listDogs);
router.patch('/:id', auth, cpUpload, updateDog);
router.delete('/:id', auth, deleteDog);

export default router;
