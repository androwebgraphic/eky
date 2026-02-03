const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
	try {
		const authHeader = req.header('Authorization');
		console.log('Auth middleware - Authorization header:', authHeader);
		
	console.log('[AUTH DEBUG] Entering auth middleware');
		const token = authHeader?.replace('Bearer ', '');
		console.log('Auth middleware - Extracted token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
		
		if (!token) {
			console.log('Auth middleware - No token provided');
			return res.status(401).json({ message: 'Access denied. No token provided.' });
		}
		
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
		console.log('Auth middleware - Token decoded successfully, userId:', decoded.userId);
		
		const user = await User.findById(decoded.userId).select('-password');
		console.log('Auth middleware - User found:', user ? user.username : 'NOT FOUND');
		
		if (!user) {
			console.log('Auth middleware - User not found in database');
			return res.status(401).json({ message: 'Token is not valid.' });
		}
		
		req.user = user;
		console.log('Auth middleware - Success, continuing to next middleware');
		console.log('[AUTH DEBUG] About to call next()');
		next();
		console.log('[AUTH DEBUG] After next() in auth middleware');
		
	} catch (error) {
		console.error('Auth middleware - Error:', error.message);
		res.status(401).json({ message: 'Token is not valid.' });
	}
};

// Middleware to check if user is admin or superadmin
const isAdmin = async (req, res, next) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Authentication required.' });
		}
		if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
			return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
		}
		next();
	} catch (error) {
		console.error('isAdmin middleware - Error:', error.message);
		res.status(500).json({ message: 'Server error.' });
	}
};

// Middleware to check if user is superadmin
const isSuperAdmin = async (req, res, next) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Authentication required.' });
		}
		if (req.user.role !== 'superadmin') {
			return res.status(403).json({ message: 'Access denied. Superadmin privileges required.' });
		}
		next();
	} catch (error) {
		console.error('isSuperAdmin middleware - Error:', error.message);
		res.status(500).json({ message: 'Server error.' });
	}
};

module.exports = auth;
module.exports.isAdmin = isAdmin;
module.exports.isSuperAdmin = isSuperAdmin;