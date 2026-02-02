const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		if (!process.env.MONGO_URI) {
			console.error('MONGO_URI not set. Please add a .env file with MONGO_URI. Example in .env.example.');
			process.exit(1);
		}
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			// to avoid warnings in the console.
		});
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error connecting to MongoDB: ${error.message}`);
		process.exit(1);
	}
};

module.exports = connectDB;