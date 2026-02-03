// Remove a d
// og from the user's wishlist
const User = require('../models/userModel');
const removeFromWishlist = async (req, res) => {
	try {
		const userId = req.user._id;
		const dogId = req.params.dogId;
		await User.findByIdAndUpdate(userId, { $pull: { wishlist: dogId } });
		res.status(200).json({ message: 'Dog removed from wishlist' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get the user's wishlist
const getWishlist = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate('wishlist');
		res.status(200).json({ wishlist: user.wishlist });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Send a password reset link (stub)
const requestPasswordReset = async (req, res) => {
	// For now, just return success
	res.status(200).json({ message: 'Password reset link (stub) sent if user exists.' });
};
// ...existing code...
const Dog = require('../models/dogModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const getUserById = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
const searchUsers = async (req, res) => {
	try {
		const query = req.query.query || '';
		if (!query.trim()) return res.json([]);
		const users = await User.find({
			$and: [
				{ _id: { $ne: req.user._id } }, // Exclude current user
				{
					$or: [
						{ username: { $regex: query, $options: 'i' } },
						{ name: { $regex: query, $options: 'i' } }
					]
				}
			]
		})
		.limit(10)
		.select('_id username name');
		res.json(users.map(u => ({ _id: u._id, userName: u.username || u.name })));
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const generateToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
		expiresIn: '30d'
	});
};
const signupUser = async (req, res) => {

	try {

		const { name, email, username, password, person, phone } = req.body;
		const user = await User.findOne({ $or: [{ email }, { username }] });

		if (user) {

			return res.status(400).json({ message: "User already exists" })
		
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password,salt);
	
	const newUser = new User({
		
		name,
		email,
		username,
		password: hashedPassword,
		person: person || 'private',
		phone
	});
	
	await newUser.save();
	
	if (newUser){
		
		res.status(201).json({
			_id:newUser._id,
			name:newUser.name,
			email:newUser.email,
			username: newUser.username,
			phone: newUser.phone,
			person: newUser.person
		})
	}else{
		
		res.status(400).json({message:"Invalid user data"})
	}
}catch (error) {

		res.status(500).json({ message: error.message })
		console.log("Error in signupUser: ", error.message);
	}
};

const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;
		
		// Find user by email
		const user = await User.findOne({ email });
		
		if (!user) {
			return res.status(400).json({ message: "Invalid email or password" });
		}
		
		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		
		if (!isPasswordValid) {
			return res.status(400).json({ message: "Invalid email or password" });
		}
		
		// Generate JWT token
		const token = generateToken(user._id);
		
		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			   role: user.role,
			   wishlist: user.wishlist || [],
			   profilePicture: user.profilePicture,
			   token
		});
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in loginUser: ", error.message);
	}
};

const updateProfile = async (req, res) => {
	try {
		console.log('=== UPDATE PROFILE START ===');
		console.log('Request body:', req.body);
		console.log('File received:', !!req.file);
		if (req.file) {
			console.log('File details:', {
				originalname: req.file.originalname,
				mimetype: req.file.mimetype,
				size: req.file.size,
				buffer: !!req.file.buffer,
				bufferLength: req.file.buffer?.length
			});
		}

		const { name, email, username, phone } = req.body;
		const userId = req.user._id;
		
		// Check if email or username is already taken by another user
		const existingUser = await User.findOne({ 
			$and: [
				{ _id: { $ne: userId } },
				{ $or: [{ email }, { username }] }
			]
		});
		
		if (existingUser) {
			return res.status(400).json({ 
				message: existingUser.email === email ? "Email already in use" : "Username already in use"
			});
		}

		// Handle profile picture upload if provided
		let profilePictureUrl = '';
		if (req.file) {
			const uploadDir = `uploads/users/${userId}`;
			
			// Create directory if it doesn't exist
			   if (!fs.existsSync(uploadDir)) {
				   try {
					   fs.mkdirSync(uploadDir, { recursive: true });
				   } catch (mkdirErr) {
					   console.error('[PROFILE UPLOAD ERROR] Failed to create uploadDir:', uploadDir, mkdirErr);
					   return res.status(500).json({ message: 'Failed to create upload directory.' });
				   }
			   }

			try {
				   // Validate file buffer
				   if (!req.file.buffer || !req.file.buffer.length) {
					   console.error('[PROFILE UPLOAD ERROR] File buffer is empty!');
					   return res.status(400).json({ message: 'Uploaded file is empty or invalid.' });
				   }
				   // Log first 16 bytes for debug
				   console.log('[PROFILE UPLOAD DEBUG] First 16 bytes:', req.file.buffer.slice(0, 16));
				   // Optionally, check mimetype
				   if (!req.file.mimetype.startsWith('image/')) {
					   console.error('[PROFILE UPLOAD ERROR] File is not an image:', req.file.mimetype);
					   return res.status(400).json({ message: 'Uploaded file is not an image.' });
				   }
				   // Determine extension and sharp pipeline
				// FORCE PNG: Always save as PNG with .png extension
				const ext = '.png';
				const filename = `profile-${Date.now()}${ext}`;
				const filepath = path.join(uploadDir, filename);
				console.log('[PROFILE UPLOAD FINAL DEBUG] FORCED PNG branch. Filename:', filename, 'Filepath:', filepath);
				try {
					await sharp(req.file.buffer)
						.rotate()
						.resize(300, 300, { fit: 'cover', position: 'center' })
						.png({ quality: 90 })
						.toFile(filepath);
				} catch (sharpErr) {
					console.error('[PROFILE UPLOAD ERROR] sharp.toFile failed:', filepath, sharpErr);
					return res.status(500).json({ message: 'Failed to save processed image.' });
				}
				// Double-check file existence after write
				if (!fs.existsSync(filepath)) {
					console.error('[PROFILE UPLOAD ERROR] File not found after sharp.toFile:', filepath);
					return res.status(500).json({ message: 'Image file missing after save.' });
				}
				console.log('Image processing completed successfully');
				// Set relative URL for database storage
				profilePictureUrl = `/${uploadDir}/${filename}`;
				console.log('Profile picture URL:', profilePictureUrl);
			} catch (imageError) {
				console.log('Error processing profile picture:', imageError);
				return res.status(500).json({ message: 'Error processing profile picture' });
			}
		}
		
		// Prepare update data
		const updateData = { name, email, username };
		if (phone) {
			updateData.phone = phone;
		}
		if (profilePictureUrl) {
			updateData.profilePicture = profilePictureUrl;
		}
		console.log('Update data:', updateData);
		
		// Update user
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			updateData,
			{ new: true, select: '-password' }
		);
		
		if (!updatedUser) {
			return res.status(404).json({ message: "User not found" });
		}

		console.log('User updated successfully:', {
			_id: updatedUser._id,
			name: updatedUser.name
		});
		
		console.log('[PROFILE UPDATE DEBUG] updatedUser.profilePicture:', updatedUser.profilePicture);
		res.status(200).json({
			message: 'Profile updated successfully',
			user: {
				_id: updatedUser._id,
				name: updatedUser.name,
				email: updatedUser.email,
				username: updatedUser.username,
				phone: updatedUser.phone,
				profilePicture: updatedUser.profilePicture
			}
		});
		
		console.log('=== UPDATE PROFILE END ===');
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in updateProfile: ", error.message);
	}
};

const deleteProfile = async (req, res) => {
	try {
		const userId = req.user._id;
		
		// Find and delete user
		const deletedUser = await User.findByIdAndDelete(userId);
		
		if (!deletedUser) {
			return res.status(404).json({ message: "User not found" });
		}
		
		// TODO: Also delete all user's dogs and related data
		// You might want to add this logic later
		
		res.status(200).json({ message: "Account deleted successfully" });
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in deleteProfile: ", error.message);
	}
};

const addToWishlist = async (req, res) => {
	try {
		const { dogId } = req.body;
		const userId = req.user._id;
		// Check if dog is already in wishlist
		const user = await User.findById(userId);
		if (user.wishlist.includes(dogId)) {
			return res.status(400).json({ message: "Dog already in wishlist" });
		}
		// Add dog to wishlist
		await User.findByIdAndUpdate(userId, {
			$push: { wishlist: dogId }
		});
		// Return updated user (without password)
		const updatedUser = await User.findById(userId).select('-password');
		res.status(200).json({ message: "Dog added to wishlist", user: updatedUser });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

module.exports = {
	signupUser,
	loginUser,
	updateProfile,
	deleteProfile,
	addToWishlist,
	removeFromWishlist,
	getWishlist,
	requestPasswordReset,
	getUserById,
	searchUsers
};
