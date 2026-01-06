const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

/**
 * 1. LAWYER DASHBOARD STATS
 */
router.get('/:userId/stats', verifyToken, allowRoles('lawyer', 'admin', 'staff'), async (req, res) => {
    const { userId } = req.params;
    try {
        const [lawyerProfile] = await db.query(
            `SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)`, 
            [userId]
        );

        if (!lawyerProfile || lawyerProfile.length === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer profile not found' });
        }
        const realLawyerId = lawyerProfile[0].id;

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
        console.error('SERVER ERROR AT STATS:', err.message);
        res.status(500).json({ success: false, message: 'Database query failed' });
    }
});

/**
 * 2. GET PUBLIC LAWYER PROFILES (For Clients)
 */
/**
 * 2. GET PUBLIC LAWYER PROFILES (For Clients)
 */
router.get('/public/list', verifyToken, async (req, res) => {
    try {
        // ✅ CRITICAL UPDATE: Added work_days to the SELECT statement
        const query = `
            SELECT id, name, specialization, experience, bio, address, phone, available_hours, work_days 
            FROM lawyers
        `;
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching public directory:', err);
        res.status(500).json({ success: false, message: 'Error fetching lawyer directory' });
    }
});

/**
 * 3. GET ALL LAWYERS (Admin/Staff Only)
 */
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM lawyers');
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching lawyers' });
    }
});

/**
 * 4. GET LAWYER BY ID
 */
router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM lawyers WHERE id = ?', [id]);
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Lawyer not found' });
        res.json({ success: true, data: results[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching lawyer' });
    }
});

/**
 * 5. A/**
 * 5. ADD NEW LAWYER (Updated with work_days)
 */
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
    // Added work_days to destructuring
    const { name, email, phone, specialization, experience, address, bio, available_hours, work_days } = req.body;
    try {
        const [results] = await db.query(
            `INSERT INTO lawyers (name, email, phone, specialization, experience, address, bio, available_hours, work_days) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, 
                email, 
                phone, 
                specialization, 
                experience, 
                address, 
                bio, 
                available_hours || "09:00,10:00,11:00,13:00,14:00,15:00",
                work_days || "Monday,Tuesday,Wednesday,Thursday,Friday" // Default value
            ]
        );
        res.status(201).json({ success: true, message: 'Lawyer added successfully', lawyerId: results.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Email already exists' });
        res.status(500).json({ success: false, message: 'Error adding lawyer' });
    }
});

/**
 * 6. UPDATE LAWYER (Updated with work_days)
 */
router.put('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, specialization, experience, address, bio, available_hours, work_days } = req.body;
    
    const query = `
        UPDATE lawyers 
        SET name=COALESCE(?,name), 
            email=COALESCE(?,email), 
            phone=COALESCE(?,phone), 
            specialization=COALESCE(?,specialization), 
            experience=COALESCE(?,experience), 
            address=COALESCE(?,address), 
            bio=COALESCE(?,bio),
            available_hours=COALESCE(?,available_hours),
            work_days=COALESCE(?,work_days) 
        WHERE id = ?`;
        
    try {
        const [results] = await db.query(query, [
            name || null, 
            email || null, 
            phone || null, 
            specialization || null, 
            experience || null, 
            address || null, 
            bio || null, 
            available_hours || null, 
            work_days || null,
            id
        ]);
        
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Lawyer not found' });
        res.json({ success: true, message: 'Lawyer profile and schedule updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating lawyer' });
    }
});
/**
 * 7. DELETE LAWYER
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