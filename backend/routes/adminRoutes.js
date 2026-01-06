const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { sendEmail } = require('../utils/notification');

/**
 * @route   POST /api/admin/authorize-lawyer
 * @desc    Adds a lawyer's email to the authorized list so they can register
 * @access  Private (Admin)
 */
router.post('/authorize-lawyer', verifyToken, allowRoles('admin'), async (req, res) => {
    const { name, email, specialization } = req.body;
    try {
        // Pre-create the lawyer profile. Status is 'Pending' until they register their user account.
        await db.query(
            'INSERT INTO lawyers (name, email, specialization, status) VALUES (?, ?, ?, ?)',
            [name, email, specialization, 'Pending']
        );
        res.status(201).json({ success: true, message: "Lawyer email authorized successfully!" });
    } catch (err) {
        console.error("Authorization Error:", err);
        res.status(500).json({ success: false, message: "Error: Email might already be authorized." });
    }
});

/**
 * @route   POST /api/admin/create-staff
 * @desc    Directly creates a Staff user in 'users' and 'staffs' tables and sends welcome email
 * @access  Private (Admin)
 */
router.post('/create-staff', verifyToken, allowRoles('admin'), async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        // 1. Hash the temporary password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert into the 'users' table (For Authentication)
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'staff']
        );

        // 3. Insert into the 'staffs' table (For Profile & Status)
        // This fixes the "profile no longer active" error
        await db.query(
            'INSERT INTO staffs (name, email, created_at) VALUES (?, ?, NOW())',
            [name, email]
        );

        // 4. Prepare the welcome email content
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

        // 5. Send the email
        await sendEmail({
            to: email,
            subject: 'Welcome to the Team - Your Staff Account Credentials',
            text: emailContent
        });

        res.status(201).json({ 
            success: true,
            message: `Staff account for ${name} created successfully and credentials emailed!` 
        });

    } catch (err) {
        console.error("Staff Creation Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Error: A user with this email already exists." });
        }
        res.status(500).json({ success: false, message: "Server error during staff creation." });
    }
});

module.exports = router;