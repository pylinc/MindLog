const mongoose = require('mongoose');
const User = require('../Models/user');
require('dotenv').config({ path: '../.env' }); // Adjust path to .env

// Connect to DB
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Connected to Database');
        promoteUser();
    })
    .catch((err) => {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    });

async function promoteUser() {
    try {
        // Get email from command line arguments
        const email = process.argv[2];

        if (!email) {
            console.error('Please provide an email address.');
            console.log('Usage: node scripts/promoteAdmin.js <email>');
            process.exit(1);
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`User ${email} is already an admin.`);
            process.exit(0);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Successfully promoted ${user.email} -> ${user.username} to ADMIN.`);
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
}
