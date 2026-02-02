const express = require('express');
const { signupUser, loginUser } = require('../controllers/userController.js');

const router = express.Router();

router.post('/registracija', signupUser);
router.post('/logiranje', loginUser);

module.exports = router;