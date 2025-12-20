const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { sendEmail } = require('../utils/notification');


/* -------------------- Create appointment -------------------- */
// Roles: admin, staff

router.post('/', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { case_id, client_id, assigned_lawyer_id, appointment_date, purpose, status } = req.body;

    if (!client_id || !assigned_lawyer_id || !appointment_date || !purpose) {
        return res.status(400).json({ success: false, message: 'client_id, assigned_lawyer_id, appointment_date, and purpose are required' });
    }

    const appointmentStatus = status || 'Pending';
    const query = `
        INSERT INTO appointments (case_id, client_id, assigned_lawyer_id, appointment_date, purpose, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(query, [case_id || null, client_id, assigned_lawyer_id, appointment_date, purpose, appointmentStatus], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error creating appointment' });

        const appointmentId = results.insertId;

        // Send notifications to client and lawyer
        db.query(
            'SELECT email FROM users WHERE id IN (?, ?)',
            [client_id, assigned_lawyer_id],
            (err, users) => {
                if (!err) {
                    users.forEach(u => {
                        sendEmail(
                            u.email,
                            'New Appointment Scheduled',
                            `An appointment (ID: ${appointmentId}) has been scheduled on ${appointment_date} for purpose: "${purpose}".`
                        );
                    });
                }
            }
        );

        res.status(201).json({ success: true, message: 'Appointment created', appointmentId });
    });
});


/* -------------------- List appointments -------------------- */
// Admin/staff = all, Lawyer = own, Client = own
router.get('/', verifyToken, (req, res) => {
    let query = 'SELECT * FROM appointments';
    let params = [];

    if (req.user.role === 'lawyer') {
        query += ' WHERE assigned_lawyer_id = ?';
        params.push(req.user.id);
    } else if (req.user.role === 'client') {
        query += ' WHERE client_id = ?';
        params.push(req.user.id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching appointments' });
        res.json({ success: true, data: results });
    });
});

/* -------------------- Get single appointment -------------------- */
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM appointments WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching appointment' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });

        const appointment = results[0];

        // Role-based access
        if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (req.user.role === 'lawyer' && appointment.assigned_lawyer_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: appointment });
    });
});

/* -------------------- Update/reschedule appointment -------------------- */
// Roles: admin, staff

router.put('/:id', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { id } = req.params;
    const { case_id, client_id, assigned_lawyer_id, appointment_date, purpose, status } = req.body;

    const query = `
        UPDATE appointments
        SET
            case_id = COALESCE(?, case_id),
            client_id = COALESCE(?, client_id),
            assigned_lawyer_id = COALESCE(?, assigned_lawyer_id),
            appointment_date = COALESCE(?, appointment_date),
            purpose = COALESCE(?, purpose),
            status = COALESCE(?, status)
        WHERE id = ?
    `;
    const values = [case_id ?? null, client_id ?? null, assigned_lawyer_id ?? null, appointment_date ?? null, purpose ?? null, status ?? null, id];

    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error updating appointment' });
        if (results.affectedRows === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });

        // Fetch client and lawyer emails
        db.query('SELECT client_id, assigned_lawyer_id FROM appointments WHERE id = ?', [id], (err, appointmentResults) => {
            if (!err && appointmentResults.length > 0) {
                const { client_id, assigned_lawyer_id } = appointmentResults[0];

                db.query(
                    'SELECT email FROM users WHERE id IN (?, ?)',
                    [client_id, assigned_lawyer_id],
                    (err, users) => {
                        if (!err) {
                            users.forEach(u => {
                                sendEmail(
                                    u.email,
                                    'Appointment Updated / Rescheduled',
                                    `Appointment ID ${id} has been updated. New date: ${appointment_date || 'unchanged'}, Purpose: ${purpose || 'unchanged'}.`
                                );
                            });
                        }
                    }
                );
            }
        });

        res.json({ success: true, message: 'Appointment updated successfully' });
    });
});


//* -------------------- Cancel/delete appointment -------------------- */
// Roles: admin, staff
router.delete('/:id', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { id } = req.params;

    // Fetch client and lawyer before deleting
    db.query('SELECT client_id, assigned_lawyer_id, appointment_date, purpose FROM appointments WHERE id = ?', [id], (err, appointmentResults) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching appointment' });
        if (appointmentResults.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });

        const { client_id, assigned_lawyer_id, appointment_date, purpose } = appointmentResults[0];

        // Delete the appointment
        db.query('DELETE FROM appointments WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Error deleting appointment' });

            // Send notifications to client and lawyer
            db.query('SELECT email FROM users WHERE id IN (?, ?)', [client_id, assigned_lawyer_id], (err, users) => {
                if (!err) {
                    users.forEach(u => {
                        sendEmail(
                            u.email,
                            'Appointment Canceled',
                            `Appointment (ID: ${id}) scheduled on ${appointment_date} for purpose "${purpose}" has been canceled.`
                        );
                    });
                }
            });

            res.json({ success: true, message: 'Appointment canceled successfully' });
        });
    });
});


module.exports = router;
