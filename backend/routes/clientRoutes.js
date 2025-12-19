const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');


//------Getting all the clients--------------//
router.get('/', verifyToken, (req, res) => {
    db.query('SELECT * FROM clients', (err, results) => {
        if (err) {
            console.error('Error fetching the clients:', err);
            return res.status(500).json({ success: false, message: 'Error fetching the clients' });
        }
        res.json({ success: true, data: results });
    });
});

//-----------Getting client by id-----------------//
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM clients WHERE id=?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching the client:', err);
            return res.status(500).json({ success: false, message: 'Error fetching the client' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        return res.json({ success: true, data: results[0] });
    });
});

//----------------Adding new client----------------------//
router.post('/', verifyToken, allowRoles('admin', 'staff'),(req, res) => {
    const { name, email, phone, address } = req.body;
    db.query(
        'INSERT INTO clients(name, email, phone, address) VALUES(?,?,?,?)',
        [name, email, phone, address],
        (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'Email already exists' });
                }
                console.error('Error adding the client', err);
                return res.status(500).json({ success: false, message: 'Error adding the client' });
            }
            res.json({ success: true, message: 'Client added successfully', clientId: results.insertId });
        }
    );
});

//-------------------Updating clients----------------//
router.put('/:id', verifyToken, allowRoles('admin', 'staff'),(req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    db.query(
        'UPDATE clients SET name=?, email=?, phone=?, address=? WHERE id=?',
        [name, email, phone, address, id],
        (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'Email already exists' });
                }
                console.error('Error updating the client', err);
                return res.status(500).json({ success: false, message: 'Error updating the client' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Client not found' });
            }
            return res.json({ success: true, message: 'Client updated successfully' });
        }
    );
});

//----------------------Deleting clients----------------------//
router.delete('/:id', verifyToken,allowRoles('admin'), (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM clients WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error deleting client:', err);
            return res.status(500).json({ success: false, message: 'Error deleting client' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        return res.json({ success: true, message: 'Client deleted successfully' });
    });
});

module.exports = router;
