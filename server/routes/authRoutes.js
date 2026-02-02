
const express = require('express');
const passport = require('../config/passport.js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d'
  });
};

// ...existing code...

module.exports = router;
