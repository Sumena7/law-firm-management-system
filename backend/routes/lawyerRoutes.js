const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');


//------------------Adding a new lawyer------------------------------//
router.post('/', verifyToken, allowRoles('admin'),(req, res) => {
    const { name, email, phone, specialization, experience, address } = req.body;
    const query = `
       INSERT INTO lawyers (name, email, phone, specialization, experience, address)
       VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [name, email, phone, specialization, experience, address], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            console.error("Error adding lawyer", err);
            return res.status(500).json({ success: false, message: 'Error adding lawyer' });
        }
        res.json({ success: true, message: 'Lawyer added successfully', lawyerId: results.insertId });
    });
});

//----------------------Getting all lawyers----------------------------//
router.get('/', verifyToken, allowRoles('admin'),(req, res) => {
    db.query('SELECT * FROM lawyers', (err, results) => {
        if (err) {
            console.error('Error fetching lawyers', err);
            return res.status(500).json({ success: false, message: 'Error fetching lawyers' });
        }
        res.json({ success: true, data: results });
    });
});

//------------------------------Getting lawyer by id-----------------------------//
router.get('/:id', verifyToken,(req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM lawyers WHERE id=?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching lawyer', err);
            return res.status(500).json({ success: false, message: 'Error fetching lawyer' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer not found' });
        }
        res.json({ success: true, data: results[0] });
    });
});

//---------------------------------Updating a lawyer-------------------------------//
router.put('/:id', verifyToken, allowRoles('admin'),(req, res) => {
    const { id } = req.params;
    const { name, email, phone, specialization, experience, address } = req.body;

    const query = `
        UPDATE lawyers
        SET name=?, email=?, phone=?, specialization=?, experience=?, address=?
        WHERE id=?
    `;

    db.query(query, [name, email, phone, specialization, experience, address, id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            console.error('Error updating lawyer:', err);
            return res.status(500).json({ success: false, message: 'Error updating lawyer' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer not found' });
        }
        res.json({ success: true, message: 'Lawyer updated successfully' });
    });
});

//------------------------- Deleting a lawyer-------------------------------//
router.delete('/:id', verifyToken, allowRoles('admin'),(req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM lawyers WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error deleting lawyer:', err);
            return res.status(500).json({ success: false, message: 'Error deleting lawyer' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer not found' });
        }
        res.json({ success: true, message: 'Lawyer deleted successfully' });
    });
});

module.exports = router;

