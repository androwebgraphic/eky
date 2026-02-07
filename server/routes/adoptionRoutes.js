const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a new adoption request
router.post('/requests', adoptionController.createAdoptionRequest);

// Get all adoption requests for current user (as owner or adopter)
router.get('/requests', adoptionController.getUserAdoptionRequests);

// Get a single adoption request
router.get('/requests/:requestId', adoptionController.getAdoptionRequest);

// Owner confirms adoption request
router.post('/requests/:requestId/owner-confirm', adoptionController.ownerConfirmRequest);

// Adopter confirms adoption request
router.post('/requests/:requestId/adopter-confirm', adoptionController.adopterConfirmRequest);

// Finalize adoption (remove dog from database)
router.post('/requests/:requestId/finalize', adoptionController.finalizeAdoption);

// Owner denies adoption request
router.post('/requests/:requestId/deny', adoptionController.denyRequest);

// Adopter cancels adoption request
router.post('/requests/:requestId/cancel', adoptionController.cancelRequest);

module.exports = router;