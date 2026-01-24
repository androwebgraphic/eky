// Get user by ID (for chat block/unblock and profile fetch)
export const getUserById = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
// User search for chat app
export const searchUsers = async (req, res) => {
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
import User from '../models/userModel.js';
import Dog from '../models/dogModel.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
		password:hashedPassword,
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
				fs.mkdirSync(uploadDir, { recursive: true });
			}

			try {
				// Process and save profile picture
				console.log('Starting image processing...');
				const filename = `profile-${Date.now()}.jpg`;
				const filepath = path.join(uploadDir, filename);
				console.log('Image will be saved to:', filepath);

				// Resize and save image with auto-rotation
				await sharp(req.file.buffer)
					.rotate() // Auto-rotate based on EXIF orientation
					.resize(300, 300, { fit: 'cover', position: 'center' })
					.jpeg({ quality: 90 })
					.toFile(filepath);

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
			name: updatedUser.name,
			profilePicture: updatedUser.profilePicture
		});
		
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
		
		res.status(200).json({ message: "Dog added to wishlist" });
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in addToWishlist: ", error.message);
	}
};

const removeFromWishlist = async (req, res) => {
	try {
		const { dogId } = req.params;
		const userId = req.user._id;
		
		// Remove dog from wishlist
		await User.findByIdAndUpdate(userId, {
			$pull: { wishlist: dogId }
		});
		
		res.status(200).json({ message: "Dog removed from wishlist" });
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in removeFromWishlist: ", error.message);
	}
};

const getWishlist = async (req, res) => {
	try {
		const userId = req.user._id;
		
		// Get user's wishlist with populated dog data
		const user = await User.findById(userId).populate({
			path: 'wishlist',
			model: 'Dog'
		});
		
		res.status(200).json(user.wishlist);
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in getWishlist: ", error.message);
	}
};

// Configure email transporter (you'll need to set up environment variables)
const createTransporter = () => {
	// For development, you can use a service like Gmail or Ethereal
	// For production, use a proper email service like SendGrid, AWS SES, etc.
	return nodemailer.createTransport({
		service: 'gmail', // or your preferred email service
		auth: {
			user: process.env.EMAIL_USER, // Your email
			pass: process.env.EMAIL_PASS  // Your app password
		}
	});
};

const requestPasswordReset = async (req, res) => {
	try {
		const { email } = req.body;
		
		// Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			// Don't reveal if email exists or not for security
			return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
		}
		
		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
		
		// Set reset token and expiration (1 hour)
		user.passwordResetToken = resetTokenHash;
		user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
		await user.save();
		
		// Create reset URL
		const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
		
		// Email content
		const message = `
			<h2>Password Reset Request</h2>
			<p>You requested a password reset for your account.</p>
			<p>Click the link below to reset your password. This link will expire in 1 hour:</p>
			<a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
			<p>If you didn't request this, please ignore this email.</p>
			<p>If the button doesn't work, copy and paste this link: ${resetUrl}</p>
		`;
		
		try {
			// Send email (if configured)
			if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
				const transporter = createTransporter();
				await transporter.sendMail({
					from: process.env.EMAIL_USER,
					to: user.email,
					subject: 'Password Reset Request - EKY Dog Adoption',
					html: message
				});
			} else {
				// For development - log the reset URL to console
				console.log('Password reset URL (development):', resetUrl);
			}
			
			res.status(200).json({ 
				message: 'Password reset link sent to your email. Please check your inbox and spam folder.' 
			});
			
		} catch (emailError) {
			console.log('Email sending failed:', emailError);
			// Clear the reset token if email fails
			user.passwordResetToken = undefined;
			user.passwordResetExpires = undefined;
			await user.save();
			
			res.status(500).json({ 
				message: 'Error sending password reset email. Please try again later.' 
			});
		}
		
	} catch (error) {
		res.status(500).json({ message: error.message });
		console.log("Error in requestPasswordReset: ", error.message);
	}
};

export { signupUser, loginUser, updateProfile, deleteProfile, addToWishlist, removeFromWishlist, getWishlist, requestPasswordReset };