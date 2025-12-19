const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');


// Add a new case → admin or staff only
router.post('/', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { title, description, status, client_id, assigned_lawyer_id } = req.body;

    const query = `
        INSERT INTO cases (title, description, status, client_id, assigned_lawyer_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [title, description, status, client_id, assigned_lawyer_id], (err, results) => {
        if (err) {
            console.error('Error adding case:', err);
            return res.status(500).json({ success: false, message: 'Error adding case' });
        }

        res.json({ success: true, message: 'Case added successfully', caseId: results.insertId });
    });
});

module.exports = router;


// Get all cases → admin or staff only
router.get('/', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const query = 'SELECT * FROM cases';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching cases:', err);
            return res.status(500).json({ success: false, message: 'Error fetching cases' });
        }

        res.json({ success: true, data: results });
    });
});


router.get('/my', verifyToken, allowRoles('lawyer'), (req, res) => {
    const lawyerId = req.user.id; // assume user.id matches lawyer ID
    db.query('SELECT * FROM cases WHERE assigned_lawyer_id = ?', [lawyerId], (err, results) => {
        if (err) {
            console.error('Error fetching assigned cases:', err);
            return res.status(500).json({ success: false, message: 'Error fetching cases' });
        }

        res.json({ success: true, data: results });
    });
});


// Get case by ID → any authenticated user
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM cases WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching case:', err);
            return res.status(500).json({ success: false, message: 'Error fetching case' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        res.json({ success: true, data: results[0] });
    });
});


// Update case → admin or staff only
router.put('/:id', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { id } = req.params;
    const { title, description, status, client_id, assigned_lawyer_id } = req.body;

    const query = `
        UPDATE cases
        SET title = ?, description = ?, status = ?, client_id = ?, assigned_lawyer_id = ?
        WHERE id = ?
    `;

    db.query(query, [title, description, status, client_id, assigned_lawyer_id, id], (err, results) => {
        if (err) {
            console.error('Error updating case:', err);
            return res.status(500).json({ success: false, message: 'Error updating case' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        res.json({ success: true, message: 'Case updated successfully' });
    });
});


// Delete case → admin only
router.delete('/:id', verifyToken, allowRoles('admin'), (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM cases WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting case:', err);
            return res.status(500).json({ success: false, message: 'Error deleting case' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        res.json({ success: true, message: 'Case deleted successfully' });
    });
});
