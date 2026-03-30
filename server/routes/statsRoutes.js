const express = require('express');
const router = express.Router();
const { getStats, resetAdoptedDogs } = require('../controllers/statsController');

// Get application statistics
router.get('/', getStats);

// Reset adopted dogs back to available (for testing purposes)
router.post('/reset-adopted', resetAdoptedDogs);

module.exports = router;
