const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { sendEmail } = require('../utils/notification');
const multer = require('multer');

// --- 1. FILE UPLOAD CONFIG ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/documents/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

// --- 2. EMAIL HELPER ---
async function getEmails(client_id, assigned_lawyer_id, reqUser, guest_email = null) {
    let clientEmail = guest_email || null; 
    let lawyerEmail = null;
    try {
        if (assigned_lawyer_id) {
            const [lawyerRows] = await db.query('SELECT email FROM lawyers WHERE id = ?', [assigned_lawyer_id]);
            if (lawyerRows.length > 0) lawyerEmail = lawyerRows[0].email;
        }
        if (!clientEmail && client_id) {
            const [clientRows] = await db.query('SELECT email FROM clients WHERE id = ?', [client_id]);
            if (clientRows.length > 0) {
                clientEmail = clientRows[0].email;
            } else {
                const [userRows] = await db.query('SELECT email FROM users WHERE id = ?', [client_id]);
                if (userRows.length > 0) clientEmail = userRows[0].email;
            }
        }
        if (!clientEmail && reqUser) clientEmail = reqUser.email;
    } catch (err) { console.error('Error resolving emails:', err); }
    return { clientEmail, lawyerEmail };
}

// --- 3. PENDING COUNT ---
router.get('/pending-count', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'Pending'");
        res.json({ success: true, count: rows[0].count });
    } catch (err) {
        res.status(500).json({ success: false, count: 0 });
    }
});

// --- 4. LIST APPOINTMENTS (Updated with Emails) ---
router.get('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    try {
        const query = `
            SELECT 
                a.*, 
                c.id AS professional_client_id, 
                u.id AS registered_user_id,
                COALESCE(c.name, u.name) AS client_name, 
                COALESCE(c.email, u.email) AS client_email,
                l.name AS lawyer_name,
                l.email AS lawyer_email
            FROM appointments a
            LEFT JOIN users u ON a.client_id = u.id
            LEFT JOIN clients c ON u.email = c.email 
            LEFT JOIN lawyers l ON a.assigned_lawyer_id = l.id
            ORDER BY a.appointment_date DESC
        `;
        const [results] = await db.query(query);

        const formattedData = results.map(row => ({
            ...row,
            id_type: row.professional_client_id ? 'Client' : 'User',
            resolved_display_id: row.professional_client_id || row.registered_user_id,
            // Fallback for guest bookings
            final_client_email: row.client_email || row.guest_email || 'N/A'
        }));

        res.json({ success: true, data: formattedData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Fetch error' });
    }
});

// --- 5. CREATE APPOINTMENT ---
router.post('/', verifyToken, allowRoles('admin', 'staff', 'client'), upload.single('document'), async (req, res) => {
    let { case_id, client_id, guest_email, assigned_lawyer_id, appointment_date, purpose, status } = req.body;
    const documentPath = req.file ? req.file.path : null;
    if (req.user.role === 'client') client_id = req.user.id;

    try {
        const [alreadyBooked] = await db.query(
            `SELECT id FROM appointments WHERE assigned_lawyer_id = ? AND appointment_date = ? AND status IN ('Scheduled', 'Pending')`,
            [assigned_lawyer_id, appointment_date]
        );
        if (alreadyBooked.length > 0) return res.status(400).json({ success: false, message: 'Time slot taken.' });

        const [results] = await db.query(
            `INSERT INTO appointments (case_id, client_id, guest_email, assigned_lawyer_id, appointment_date, purpose, status, initial_document, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [case_id || null, client_id || null, guest_email || null, assigned_lawyer_id, appointment_date, purpose, status || 'Pending', documentPath]
        );

        const appointmentId = results.insertId;
        const { clientEmail, lawyerEmail } = await getEmails(client_id, assigned_lawyer_id, req.user, guest_email);

        if (clientEmail) await sendEmail({ to: clientEmail, subject: 'Appointment Confirmation', text: `Scheduled for ${appointment_date}.` });
        if (lawyerEmail) await sendEmail({ to: lawyerEmail, subject: 'New Assignment', text: `New appointment on ${appointment_date}.` });

        res.status(201).json({ success: true, appointmentId });
    } catch (err) { res.status(500).json({ success: false, message: 'Database error' }); }
});

// --- 6. UPDATE APPOINTMENT (Updated with Emails) ---
router.put('/:id', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    let { assigned_lawyer_id, status, appointment_date, purpose, case_id } = req.body;

    try {
        await db.query(
            `UPDATE appointments SET 
                assigned_lawyer_id = COALESCE(?, assigned_lawyer_id), 
                status = COALESCE(?, status), 
                appointment_date = COALESCE(?, appointment_date), 
                purpose = COALESCE(?, purpose), 
                case_id = COALESCE(?, case_id) 
             WHERE id = ?`,
            [assigned_lawyer_id || null, status, appointment_date, purpose, case_id || null, id]
        );

        const [updated] = await db.query(`
            SELECT 
                a.*, 
                c.id AS professional_client_id,
                u.id AS registered_user_id,
                COALESCE(c.name, u.name) AS client_name, 
                COALESCE(c.email, u.email) AS client_email,
                l.name AS lawyer_name,
                l.email AS lawyer_email
            FROM appointments a
            LEFT JOIN users u ON a.client_id = u.id
            LEFT JOIN clients c ON u.email = c.email
            LEFT JOIN lawyers l ON a.assigned_lawyer_id = l.id
            WHERE a.id = ?`, [id]
        );

        const row = updated[0];
        const formattedUpdate = {
            ...row,
            id_type: row.professional_client_id ? 'Client' : 'User',
            resolved_display_id: row.professional_client_id || row.registered_user_id,
            final_client_email: row.client_email || row.guest_email || 'N/A'
        };

        const { clientEmail, lawyerEmail } = await getEmails(row.client_id, row.assigned_lawyer_id, null, row.guest_email);
        if (clientEmail) await sendEmail({ to: clientEmail, subject: 'Update', text: `Status: ${status}.` });
        if (lawyerEmail) await sendEmail({ to: lawyerEmail, subject: 'Update', text: `Status: ${status}.` });

        res.json({ success: true, data: formattedUpdate });
    } catch (err) { res.status(500).json({ success: false, message: 'Update failed' }); }
});

// --- 7. DELETE / 8. VIEWS / 9. SLOTS (Remain Same as previous working version) ---
router.delete('/:id', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    try {
        const [apptRows] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
        if (apptRows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        const appointment = apptRows[0];
        const { clientEmail, lawyerEmail } = await getEmails(appointment.client_id, appointment.assigned_lawyer_id, req.user, appointment.guest_email);
        await db.query('DELETE FROM appointments WHERE id = ?', [id]);
        if (clientEmail) await sendEmail({ to: clientEmail, subject: 'Cancelled', text: 'Canceled.' });
        if (lawyerEmail) await sendEmail({ to: lawyerEmail, subject: 'Cancelled', text: 'Canceled.' });
        res.json({ success: true, message: 'Canceled.' });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/lawyer/:userId', verifyToken, allowRoles('admin', 'lawyer'), async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT 
                a.*, 
                -- 1. Get Name: Check Client Table, then User Table, then fallback to "Guest"
                COALESCE(cl.name, u_client.name, 'Guest User') AS resolved_name,
                
                -- 2. Get Email: Check Client Table, then User Table, then the guest_email column in appointments
                COALESCE(cl.email, u_client.email, a.guest_email) AS resolved_email,
                
                c.title AS case_title 
            FROM appointments a 
            -- Join to users to find registered users
            LEFT JOIN users u_client ON a.client_id = u_client.id
            -- Join to clients via email to find professional client profiles
            LEFT JOIN clients cl ON (u_client.email = cl.email OR a.guest_email = cl.email)
            -- Join to cases
            LEFT JOIN cases c ON a.case_id = c.id
            WHERE a.assigned_lawyer_id = (
                SELECT id FROM lawyers WHERE email = (SELECT email FROM users WHERE id = ?)
            )
            ORDER BY a.appointment_date ASC`;
            
        const [results] = await db.query(query, [userId]);
        res.json({ success: true, data: results });
    } catch (err) { 
        console.error("Database Error:", err);
        res.status(500).json({ success: false }); 
    }
});
router.get('/client/:userId', verifyToken, allowRoles('admin', 'client'), async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `SELECT a.*, l.name AS lawyer_name FROM appointments a LEFT JOIN lawyers l ON a.assigned_lawyer_id = l.id WHERE a.client_id = (SELECT id FROM clients WHERE email = (SELECT email FROM users WHERE id = ?)) OR a.client_id = ? ORDER BY a.appointment_date ASC`;
        const [results] = await db.query(query, [userId, userId]);
        res.json({ success: true, data: results });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/available-slots/:lawyerId/:date', async (req, res) => {
    try {
        const { lawyerId, date } = req.params;
        const [lawyer] = await db.query('SELECT available_hours FROM lawyers WHERE id = ?', [lawyerId]);
        const slots = (lawyer[0]?.available_hours || "09:00,10:00,11:00,13:00,14:00,15:00").split(',');
        const [booked] = await db.query(`SELECT DATE_FORMAT(appointment_date, '%H:%i') as booked_time FROM appointments WHERE assigned_lawyer_id = ? AND DATE(appointment_date) = ? AND status IN ('Scheduled', 'Pending')`, [lawyerId, date]);
        const bookedTimes = booked.map(b => b.booked_time);
        res.json({ success: true, availableSlots: slots.filter(s => !bookedTimes.includes(s.trim())) });
    } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;