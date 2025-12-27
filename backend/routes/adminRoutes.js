const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/authMiddleware');
const { sendEmail } = require('../utils/notification'); // Ensure this path to your notification.js is correct

// Middleware to ensure only Admins can access these routes
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
};

/**
 * @route   POST /api/admin/authorize-lawyer
 * @desc    Adds a lawyer's email to the authorized list so they can register
 * @access  Private (Admin)
 */
router.post('/authorize-lawyer', verifyToken, isAdmin, async (req, res) => {
    const { name, email, specialization } = req.body;
    try {
        await db.query(
            'INSERT INTO lawyers (name, email, specialization) VALUES (?, ?, ?)',
            [name, email, specialization]
        );
        res.status(201).json({ message: "Lawyer email authorized successfully!" });
    } catch (err) {
        console.error("Authorization Error:", err);
        res.status(500).json({ message: "Error: Email might already be authorized." });
    }
});

/**
 * @route   POST /api/admin/create-staff
 * @desc    Directly creates a Staff user and sends them an automated welcome email
 * @access  Private (Admin)
 */
router.post('/create-staff', verifyToken, isAdmin, async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        // 1. Hash the temporary password for database security
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert the user directly into the users table with the 'staff' role
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'staff']
        );

        // 3. Prepare the welcome email content
        const emailContent = `
Hello ${name},

An administrative staff account has been created for you at JusticePanel.

Your login credentials are:
URL: http://localhost:5173/auth/login
Email: ${email}
Temporary Password: ${password}

Please log in and change your password immediately from your profile settings.

Best regards,
JusticePanel Administration
        `;

        // 4. Send the email using your notification.js utility
        await sendEmail({
            to: email,
            subject: 'Welcome to the Team - Your Staff Account Credentials',
            text: emailContent
        });

        res.status(201).json({ 
            message: `Staff account for ${name} created successfully and credentials emailed!` 
        });

    } catch (err) {
        console.error("Staff Creation Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Error: A user with this email already exists." });
        }
        res.status(500).json({ message: "Server error during staff creation." });
    }
});

module.exports = router;