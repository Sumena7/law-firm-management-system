
const { findSimilarCases } = require('../utils/caseSearch');
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

/* Get cases assigned to logged-in lawyer */
router.get('/my', verifyToken, allowRoles('lawyer'), (req, res) => {
    const lawyerId = req.user.id;
    db.query('SELECT * FROM cases WHERE assigned_lawyer_id = ?', [lawyerId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching cases' });
        res.json({ success: true, data: results });
    });
});

/* Get all cases (Admin / Staff) */
router.get('/', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    db.query('SELECT * FROM cases', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching cases' });
        res.json({ success: true, data: results });
    });
});

/* Get single case by ID with similar cases */
router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        // 1️⃣ Fetch current case
        const [results] = await db.query('SELECT * FROM cases WHERE id = ?', [id]);
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Case not found' });

        const currentCase = results[0];

        // 2️⃣ Fetch similar cases using your utility
        const similarCases = await findSimilarCases(id, currentCase.title, currentCase.description);

        // 3️⃣ Return current case + similar cases
        res.json({ success: true, data: { currentCase, similarCases } });

    } catch (error) {
        console.error('Error fetching case:', error);
        res.status(500).json({ success: false, message: 'Error fetching case' });
    }
});

/* Create new case (STRICT VALIDATION) */
router.post('/', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { title, description, status, client_id, assigned_lawyer_id } = req.body;
    if (!title || !description || !status || !client_id)
        return res.status(400).json({ success: false, message: 'title, description, status, and client_id are required' });

    const query = 'INSERT INTO cases (title, description, status, client_id, assigned_lawyer_id) VALUES (?, ?, ?, ?, ?)';
    const values = [title, description, status, client_id, assigned_lawyer_id || null];

    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error creating case' });
        res.status(201).json({ success: true, message: 'Case created successfully', caseId: results.insertId });
    });
});

/* Update case (NO STRICT VALIDATION – PARTIAL UPDATE) */
router.put('/:id', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { id } = req.params;
    const { title, description, status, client_id, assigned_lawyer_id } = req.body;

    const query = `
        UPDATE cases
        SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            client_id = COALESCE(?, client_id),
            assigned_lawyer_id = COALESCE(?, assigned_lawyer_id)
        WHERE id = ?
    `;
    const values = [title ?? null, description ?? null, status ?? null, client_id ?? null, assigned_lawyer_id ?? null, id];

    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error updating case' });
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Case not found' });
        res.json({ success: true, message: 'Case updated successfully' });
    });
});

/* Delete case (Admin only) */
router.delete('/:id', verifyToken, allowRoles('admin'), (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM cases WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting case' });
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Case not found' });
        res.json({ success: true, message: 'Case deleted successfully' });
    });
});

module.exports = router;
