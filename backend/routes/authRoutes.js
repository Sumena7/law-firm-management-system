const crypto = require("crypto");
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { sendEmail } = require('../utils/notification');


const JWT_SECRET =process.env.JWT_SECRET; // Secret key for signing JWTs

// ---------------- REGISTER ----------------
router.post('/register', async (req, res) => {
    let { name, email, password, role } = req.body;

    // Default role to 'client' (outsider)
    role = role || 'client';

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        // 1️⃣ GATEKEEPER CHECK: Verify internal office roles
        if (role === 'lawyer') {
            const [lawyer] = await db.query('SELECT id FROM lawyers WHERE email = ?', [email]);
            if (lawyer.length === 0) {
                return res.status(403).json({ message: 'Your email is not authorized as a Lawyer profile. Please contact Admin.' });
            }
        } 
        else if (role === 'staff') {
            const [staff] = await db.query('SELECT id FROM staffs WHERE email = ?', [email]);
            if (staff.length === 0) {
                return res.status(403).json({ message: 'Your email is not authorized as a Staff member. Please contact Admin.' });
            }
        }
        else if (role === 'admin') {
            // Prevent random registration as Admin if one already exists
            const [adminCheck] = await db.query('SELECT id FROM users WHERE role = "admin"');
            if (adminCheck.length > 0) {
                return res.status(403).json({ message: 'Administrative registration is closed. Contact the existing Admin to create an account.' });
            }
        }

        // 2️⃣ Check if email already exists in users table
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // 3️⃣ Hash the password and Insert
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: `User registered successfully as ${role}` });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------------- LOGIN ----------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // 4️⃣ OPTIONAL: Active Status Check
        // If an employee is removed from the lawyer/staff table, they shouldn't be able to log in
        if (user.role === 'lawyer') {
            const [lawyer] = await db.query('SELECT id FROM lawyers WHERE email = ?', [email]);
            if (lawyer.length === 0) return res.status(403).json({ message: 'Your lawyer profile is no longer active.' });
        } else if (user.role === 'staff') {
            const [staff] = await db.query('SELECT id FROM staffs WHERE email = ?', [email]);
            if (staff.length === 0) return res.status(403).json({ message: 'Your staff profile is no longer active.' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------------- GET LOGGED-IN USER ----------------
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ user: users[0] });
    } catch (err) {
        console.error('Fetch user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
// ---------------- FORGOT PASSWORD ----------------
router.post('/forgot-password', async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Trim the email to avoid extra spaces
    email = email.trim();

    // Find user by email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log(`Forgot password requested for unknown email: "${email}"`);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    if (!user.email) {
      console.error('User has no email in database:', user);
      return res.status(500).json({ message: 'Email missing for user' });
    }

    // Generate a random token
    const token = crypto.randomBytes(20).toString('hex');

    // Set expiry (15 minutes from now)
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save token and expiry in users table
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );

    // Build reset link
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    console.log(`Sending reset email to: ${user.email}`);
    console.log(`Reset link: ${resetLink}`);

    // Send actual email using your existing utility
    await sendEmail({
      to: user.email.trim(), // ensure no spaces
      subject: 'Password Reset Request',
      text: `Hello ${user.name},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    });

    res.json({ message: 'Reset link sent to your email!' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------- RESET PASSWORD ----------------
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Find user with this token and check expiry
    const [users] = await db.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      console.log(`Reset password failed: invalid or expired token "${token}"`);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = users[0];
    console.log(`Resetting password for user: ${user.email}`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log(`Password reset successfully for user: ${user.email}`);
    res.json({ message: 'Password has been reset successfully ✅' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;