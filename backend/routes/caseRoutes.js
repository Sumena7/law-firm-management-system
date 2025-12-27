const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { findSimilarCases } = require('../utils/caseSearch'); // AI Similarity Tool

// ------------------------------------------------------------------
// 1. GET CASES BY LAWYER (USER ID)
// Used by the LawyerDashboard to populate the main table
// ------------------------------------------------------------------
router.get('/lawyer/:userId', verifyToken, allowRoles('admin', 'lawyer'), async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT 
                c.id AS case_id, 
                c.title AS case_title, 
                c.status, 
                c.description,
                cl.name AS client_name,
                (SELECT appointment_date FROM appointments 
                 WHERE case_id = c.id ORDER BY appointment_date ASC LIMIT 1) AS next_hearing
            FROM cases c
            LEFT JOIN clients cl ON c.client_id = cl.id
            WHERE c.assigned_lawyer_id = (
                SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)
            )`;
            
        const [results] = await db.query(query, [userId]);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching lawyer cases:', err);
        res.status(500).json({ success: false, message: 'Error fetching cases' });
    }
});

// ------------------------------------------------------------------
// 2. GET SINGLE CASE BY ID (With AI AI Similarity)
// Used when a lawyer clicks "View Details" to perform research
// ------------------------------------------------------------------
router.get('/:id', verifyToken, allowRoles('admin', 'client', 'lawyer'), async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM cases WHERE id = ?', [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        const currentCase = results[0];

        // RESTORED AI LOGIC:
        // We use the AI utility to find past cases that match the current description
        const similarCases = await findSimilarCases(
            currentCase.id,
            currentCase.title,
            currentCase.description,
            5 // Number of recommendations
        );

        res.json({ 
            success: true, 
            data: { 
                currentCase, 
                similarCases // The AI results are sent back to the frontend here
            } 
        });
    } catch (err) {
        console.error('Error fetching case details:', err);
        res.status(500).json({ success: false, message: 'Error fetching case research' });
    }
});

// ------------------------------------------------------------------
// 3. GET ALL CASES (Admin / Staff Only)
// ------------------------------------------------------------------
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cases');
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching cases' });
    }
});

// ------------------------------------------------------------------
// 4. CREATE NEW CASE
// ------------------------------------------------------------------
router.post('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { title, description, status, client_id, assigned_lawyer_id } = req.body;
    try {
        const query = 'INSERT INTO cases (title, description, status, client_id, assigned_lawyer_id) VALUES (?, ?, ?, ?, ?)';
        const [results] = await db.query(query, [title, description, status, client_id, assigned_lawyer_id || null]);
        res.status(201).json({ success: true, message: 'Case created successfully', caseId: results.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error creating case' });
    }
});

// ------------------------------------------------------------------
// 5. UPDATE CASE
// ------------------------------------------------------------------
router.put('/:id', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
    const { id } = req.params;
    const { title, description, status, client_id, assigned_lawyer_id } = req.body;
    const query = `
        UPDATE cases SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            client_id = COALESCE(?, client_id),
            assigned_lawyer_id = COALESCE(?, assigned_lawyer_id)
        WHERE id = ?`;
    try {
        const [results] = await db.query(query, [title ?? null, description ?? null, status ?? null, client_id ?? null, assigned_lawyer_id ?? null, id]);
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Case not found' });
        res.json({ success: true, message: 'Case updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating case' });
    }
});

// ------------------------------------------------------------------
// 6. DELETE CASE
// ------------------------------------------------------------------
router.delete('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM cases WHERE id = ?', [id]);
        res.json({ success: true, message: 'Case deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting case' });
    }
});

module.exports = router;