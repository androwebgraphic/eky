const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');

// Get application statistics
router.get('/', getStats);

module.exports = router;