const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRETS = [
	process.env.JWT_SECRET,
	'fallback_secret'
].filter(Boolean);

// Remove duplicates
const uniqueSecrets = [...new Set(JWT_SECRETS)];

const auth = async (req, res, next) => {
	try {
		const authHeader = req.header('Authorization');
		const token = authHeader?.replace('Bearer ', '');
		if (!token) {
			return res.status(401).json({ message: 'Access denied. No token provided.' });
		}
		let decoded;
		let lastError;
		for (const secret of uniqueSecrets) {
			try {
				decoded = jwt.verify(token, secret);
				break;
			} catch (err) {
				lastError = err;
			}
		}
		if (!decoded) {
			return res.status(401).json({ message: 'Invalid token' });
		}
		const user = await User.findById(decoded.userId).select('-password');
		if (!user) {
			return res.status(401).json({ message: 'Token is not valid.' });
		}
		req.user = user;
		next();
		
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