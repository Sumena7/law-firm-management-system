const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

//------ Getting all the clients (Admin/Staff Only) --------------//
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM clients');
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching the clients:', err);
        res.status(500).json({ success: false, message: 'Error fetching the clients' });
    }
});

//----------- NEW: Get clients for a Specific Lawyer (Dashboard) -----------------//
// Fixes 403/404: /api/clients/lawyer/22
router.get('/lawyer/:userId', verifyToken, allowRoles('admin', 'lawyer'), async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Convert User ID to Lawyer ID via Email Bridge
        const lawyerQuery = `SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)`;
        const [lawyerProfile] = await db.query(lawyerQuery, [userId]);

        if (lawyerProfile.length === 0) {
            return res.status(404).json({ success: false, message: 'Lawyer profile not found' });
        }

        const realLawyerId = lawyerProfile[0].id;

        // 2. Fetch clients associated with this lawyer's cases
        const query = `
            SELECT DISTINCT 
                cl.id, 
                cl.name, 
                cl.email, 
                cl.phone, 
                cl.address
            FROM clients cl
            JOIN cases ca ON cl.id = ca.client_id
            WHERE ca.assigned_lawyer_id = ?
        `;
        
        const [results] = await db.query(query, [realLawyerId]);
        
        // Return in standardized format for React
        res.json({ success: true, data: results }); 
    } catch (err) {
        console.error('Error fetching lawyer clients:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

//----------- Getting client by id -----------------//
router.get('/:id', verifyToken, allowRoles('admin', 'staff', 'lawyer'), async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM clients WHERE id=?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.json({ success: true, data: results[0] });
    } catch (err) {
        console.error('Error fetching the client:', err);
        res.status(500).json({ success: false, message: 'Error fetching the client' });
    }
});

//---------------- Adding new client ----------------------//
router.post('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const [results] = await db.query(
            'INSERT INTO clients(name, email, phone, address) VALUES(?,?,?,?)',
            [name, email, phone, address]
        );
        res.json({ success: true, message: 'Client added successfully', clientId: results.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: 'Error adding the client' });
    }
});

//------------------- Updating clients ----------------//
router.put('/:id', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const query = `
        UPDATE clients
        SET
            name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            address = COALESCE(?, address)
        WHERE id = ?
    `;
    const values = [name ?? null, email ?? null, phone ?? null, address ?? null, id];

    try {
        const [results] = await db.query(query, values);
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.json({ success: true, message: 'Client updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating the client' });
    }
});

//---------------------- Deleting clients ----------------------//
router.delete('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('DELETE FROM clients WHERE id = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.json({ success: true, message: 'Client deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting client' });
    }
});

module.exports = router;