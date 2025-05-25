/**
 * Script to create a test user in the database
 * 
 * Usage: 
 * node scripts/create-test-user.js <email> <password> <name> <role>
 * 
 * Example:
 * node scripts/create-test-user.js test@example.com password123 "Test User" Admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword } = require('../utils/bcrypt');

// Import models
const User = require('../modules/users/models/User');
const Account = require('../modules/users/models/Account');

async function createTestUser(email, password, name, role) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Check if user already exists
        const existingAccount = await Account.findOne({ email });

        if (existingAccount) {
            console.error(`An account with email ${email} already exists`);
            process.exit(1);
        }

        // Create user
        const user = new User({
            nom: name,
            email: email,
            role: role
        });

        const savedUser = await user.save();
        console.log(`User created with ID: ${savedUser._id}`);

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create account
        const account = new Account({
            email: email,
            motDePasse: hashedPassword,
            utilisateurAssocie: savedUser._id,
            mustChangePassword: false
        });

        await account.save();
        console.log(`Account created for ${email}`);
        console.log('Test user created successfully');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${role}`);

    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Get parameters from command line arguments
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];
const role = process.argv[5] || 'User';

if (!email || !password || !name) {
    console.error('Usage: node scripts/create-test-user.js <email> <password> <name> <role>');
    process.exit(1);
}

// Execute the user creation
createTestUser(email, password, name, role); 