import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

const checkUsers = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not set');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users in the database:`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Name: ${user.name}, Username: ${user.username}, Email: ${user.email}, ID: ${user._id}`);
        });

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkUsers();