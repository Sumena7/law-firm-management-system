const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

/**
 * 1. LAWYER DASHBOARD STATS
 * URL: /api/lawyers/:userId/stats
 * Priority: High (placed above /:id)
 * Access: lawyer, admin, staff
 */
router.get('/:userId/stats', verifyToken, allowRoles('lawyer', 'admin', 'staff'), async (req, res) => {
    const { userId } = req.params;
    try {
        // 1. Get Lawyer ID
        const [lawyerProfile] = await db.query(
            `SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)`, 
            [userId]
        );

        if (!lawyerProfile || lawyerProfile.length === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer profile not found' });
        }
        const realLawyerId = lawyerProfile[0].id;

        // 2. Optimized Stats Query
        // FIX: Changed c.case_id to c.id (Common cause for 500 error)
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM cases WHERE assigned_lawyer_id = ?) as total_cases,
                (SELECT COUNT(*) FROM appointments WHERE assigned_lawyer_id = ? AND appointment_date >= CURDATE()) as upcoming_appointments,
                (SELECT COUNT(DISTINCT client_id) FROM cases WHERE assigned_lawyer_id = ?) as total_clients,
                (SELECT COUNT(*) FROM documents d 
                 JOIN cases c ON d.case_id = c.id 
                 WHERE c.assigned_lawyer_id = ?) as total_documents
        `;
        
        const [results] = await db.query(statsQuery, [realLawyerId, realLawyerId, realLawyerId, realLawyerId]);
        res.json({ success: true, data: results[0] });

    } catch (err) {
        console.error('SERVER CRASHED AT STATS:', err.message); // This will show in your terminal
        res.status(500).json({ success: false, message: 'Database query failed', error: err.message });
    }
});

/**
 * 2. GET ALL LAWYERS (Admin/Staff Only)
 * URL: /api/lawyers
 */
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM lawyers');
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching lawyers', err);
        res.status(500).json({ success: false, message: 'Error fetching lawyers' });
    }
});

/**
 * 3. GET LAWYER BY ID (Profile View)
 * URL: /api/lawyers/:id
 * Priority: Low (placed at bottom)
 */
router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM lawyers WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer not found' });
        }
        res.json({ success: true, data: results[0] });
    } catch (err) {
        console.error('Error fetching lawyer', err);
        res.status(500).json({ success: false, message: 'Error fetching lawyer' });
    }
});

/**
 * 4. ADD NEW LAWYER (Admin Only)
 */
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
    const { name, email, phone, specialization, experience, address } = req.body;
    try {
        const [results] = await db.query(
            `INSERT INTO lawyers (name, email, phone, specialization, experience, address) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, phone, specialization, experience, address]
        );
        res.status(201).json({ success: true, message: 'Lawyer added successfully', lawyerId: results.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Email already exists' });
        res.status(500).json({ success: false, message: 'Error adding lawyer' });
    }
});

/**
 * 5. UPDATE LAWYER (Admin Only)
 */
router.put('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, specialization, experience, address } = req.body;
    const query = `
        UPDATE lawyers 
        SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone), 
            specialization=COALESCE(?,specialization), experience=COALESCE(?,experience), address=COALESCE(?,address) 
        WHERE id = ?`;
    try {
        const [results] = await db.query(query, [name??null, email??null, phone??null, specialization??null, experience??null, address??null, id]);
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Lawyer not found' });
        res.json({ success: true, message: 'Lawyer updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating lawyer' });
    }
});

/**
 * 6. DELETE LAWYER (Admin Only)
 */
router.delete('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('DELETE FROM lawyers WHERE id = ?', [id]);
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Lawyer not found' });
        res.json({ success: true, message: 'Lawyer deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting lawyer' });
    }
});

module.exports = router;