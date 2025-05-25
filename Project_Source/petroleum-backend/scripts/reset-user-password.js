/**
 * Script to reset a user's password in the database
 * 
 * Usage: 
 * node scripts/reset-user-password.js <email> <newPassword>
 * 
 * Example:
 * node scripts/reset-user-password.js admin@example.com newSecurePassword123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword } = require('../utils/bcrypt');

// Import models
const Account = require('../modules/users/models/Account');

async function resetPassword(email, newPassword) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Find the account
        const account = await Account.findOne({ email });

        if (!account) {
            console.error(`Account with email ${email} not found`);
            process.exit(1);
        }

        console.log(`Found account for ${email}`);

        // Hash and encrypt the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the account
        await Account.updateOne(
            { email },
            {
                $set: {
                    motDePasse: hashedPassword,
                    mustChangePassword: false
                }
            }
        );

        console.log(`Password for ${email} has been reset successfully`);
        console.log('User can now log in with the new password');

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-user-password.js <email> <newPassword>');
    process.exit(1);
}

// Execute the password reset
resetPassword(email, newPassword); 