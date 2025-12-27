const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { sendEmail } = require('../utils/notification');

// ---------------- Updated Helper to get emails ----------------
async function getEmails(client_id, assigned_lawyer_id, reqUser, guest_email = null) {
    let clientEmail = guest_email || null; // Prioritize guest email if provided
    let lawyerEmail = null;

    try {
        // 1. Resolve Lawyer Email
        if (assigned_lawyer_id) {
            const [lawyerRows] = await db.query('SELECT email FROM lawyers WHERE id = ?', [assigned_lawyer_id]);
            if (lawyerRows.length > 0) lawyerEmail = lawyerRows[0].email;
        }

        // 2. Resolve Client Email (If not already a guest)
        if (!clientEmail && client_id) {
            // Check the clients table first
            const [clientRows] = await db.query('SELECT email FROM clients WHERE id = ?', [client_id]);
            if (clientRows.length > 0) {
                clientEmail = clientRows[0].email;
            } else {
                // FALLBACK: Check the users table (In case client_id is a User ID)
                const [userRows] = await db.query('SELECT email FROM users WHERE id = ?', [client_id]);
                if (userRows.length > 0) clientEmail = userRows[0].email;
            }
        }

        // 3. Fallback to the logged-in user if they are the one booking
        if (!clientEmail && reqUser) {
            clientEmail = reqUser.email;
        }

    } catch (err) {
        console.error('Error resolving emails:', err);
    }
    return { clientEmail, lawyerEmail };
}

// ---------------- 1. Get Appointments for a Specific Lawyer ----------------
router.get('/lawyer/:userId', verifyToken, allowRoles('admin', 'lawyer'), async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT 
                a.*, 
                c.title AS case_title, 
                cl.name AS client_name
            FROM appointments a
            LEFT JOIN cases c ON a.case_id = c.id
            LEFT JOIN clients cl ON a.client_id = cl.id
            WHERE a.assigned_lawyer_id = (
                SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)
            )
            ORDER BY a.appointment_date ASC`;
        
        const [results] = await db.query(query, [userId]);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching lawyer appointments:', err);
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
});

// ---------------- 2. Create Appointment ----------------
router.post('/', verifyToken, allowRoles('admin', 'staff', 'client'), async (req, res) => {
    let { case_id, client_id, guest_email, assigned_lawyer_id, appointment_date, purpose, status } = req.body;

    // If a client is logged in, use their ID
    if (req.user.role === 'client') client_id = req.user.id;

    if (!assigned_lawyer_id || !appointment_date || !purpose) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        const [results] = await db.query(
            `INSERT INTO appointments 
            (case_id, client_id, guest_email, assigned_lawyer_id, appointment_date, purpose, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [case_id || null, client_id || null, guest_email || null, assigned_lawyer_id, appointment_date, purpose, status || 'Pending']
        );

        const appointmentId = results.insertId;
        
        // Fetch emails using the updated robust helper
        const { clientEmail, lawyerEmail } = await getEmails(client_id, assigned_lawyer_id, req.user, guest_email);

        console.log(`Attempting to notify: Client(${clientEmail}), Lawyer(${lawyerEmail})`);

        if (clientEmail) {
            await sendEmail({
                to: clientEmail,
                subject: 'Appointment Confirmation - JusticePanel',
                text: `Hello, your appointment regarding "${purpose}" is scheduled for ${appointment_date}. Appointment ID: ${appointmentId}.`
            });
        }
        
        if (lawyerEmail) {
            await sendEmail({
                to: lawyerEmail,
                subject: 'New Appointment Assigned',
                text: `You have a new appointment on ${appointment_date}. \nPurpose: ${purpose} \nClient Contact: ${clientEmail || 'Guest'}`
            });
        }

        res.status(201).json({ success: true, appointmentId });
    } catch (err) {
        console.error('Create error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ---------------- 3. List Appointments (General Admin/Staff) ----------------
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM appointments ORDER BY appointment_date DESC');
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Fetch error' });
    }
});

// ---------------- 4. Get Single Appointment ----------------
router.get('/:id', verifyToken, allowRoles('admin', 'lawyer', 'client'), async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: results[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------- 5. Delete / Cancel Appointment ----------------
router.delete('/:id', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    try {
        const [apptRows] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
        if (apptRows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        const appointment = apptRows[0];
        const { clientEmail, lawyerEmail } = await getEmails(appointment.client_id, appointment.assigned_lawyer_id, req.user, appointment.guest_email);

        await db.query('DELETE FROM appointments WHERE id = ?', [id]);

        const cancelContent = {
            subject: 'Appointment Cancellation Notice',
            text: `The appointment scheduled for ${appointment.appointment_date} has been canceled.`
        };

        if (clientEmail) await sendEmail({ to: clientEmail, ...cancelContent });
        if (lawyerEmail) await sendEmail({ to: lawyerEmail, ...cancelContent });

        res.json({ success: true, message: 'Canceled and participants notified.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Delete error' });
    }
});

module.exports = router;