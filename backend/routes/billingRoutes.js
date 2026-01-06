const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { sendEmail } = require('../utils/notification');
const PDFDocument = require('pdfkit');
const os = require('os');
const fs = require('fs');
const path = require('path');

// -------------------- 1. Create a New Invoice -------------------- //
router.post('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { case_id, appointment_id, amount, issued_date, due_date, status } = req.body;

    // Validation: Require either Case ID or Appointment ID
    if ((!case_id && !appointment_id) || !amount || !issued_date || !due_date) {
        return res.status(400).json({ success: false, message: 'Reference ID, amount, and dates are required' });
    }

    const invoiceStatus = status || 'Pending';

    try {
        // 1. Insert invoice into DB (Handles NULL for case_id or appointment_id)
        const [results] = await db.query(
            `INSERT INTO invoices (case_id, appointment_id, amount, issued_date, due_date, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [case_id || null, appointment_id || null, amount, issued_date, due_date, invoiceStatus]
        );

        const invoiceId = results.insertId;
        let recipient = null;

        // 2. RECIPIENT LOOKUP LOGIC
        if (case_id) {
            // Standard Case -> Client lookup
            const [rows] = await db.query(`
                SELECT c.name, c.email FROM cases ca
                JOIN clients c ON ca.client_id = c.id
                WHERE ca.id = ?`, [case_id]);
            recipient = rows[0];
        } else if (appointment_id) {
            // Appointment Lookup: Check Users table first, then fallback to Clients
            const [appt] = await db.query(`SELECT client_id FROM appointments WHERE id = ?`, [appointment_id]);
            
            if (appt.length > 0) {
                const targetId = appt[0].client_id;

                // Attempt to find in Users table (e.g., User: 29)
                const [userRows] = await db.query(`SELECT name, email FROM users WHERE id = ?`, [targetId]);
                
                if (userRows.length > 0 && userRows[0].email) {
                    recipient = userRows[0];
                } else {
                    // Fallback to Clients table (e.g., Client: 10)
                    const [clientRows] = await db.query(`SELECT name, email FROM clients WHERE id = ?`, [targetId]);
                    recipient = clientRows[0];
                }
            }
        }

        // 3. GENERATE PDF & SEND EMAIL if recipient exists
        if (recipient && recipient.email) {
            const tempDir = path.join(os.tmpdir(), `invoice_${invoiceId}`);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const pdfPath = path.join(tempDir, `Invoice_${invoiceId}.pdf`);

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(fs.createWriteStream(pdfPath));

            doc.fontSize(22).text('Everest Law Chamber', { align: 'center' });
            doc.fontSize(14).text('Invoice / Receipt', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Invoice ID: #${invoiceId}`);
            doc.text(`Bill To: ${recipient.name}`);
            doc.text(`Reference: ${case_id ? `Case #${case_id}` : `Appointment #${appointment_id}`}`);
            doc.text(`Amount: Rs. ${Number(amount).toFixed(2)}`);
            doc.text(`Issued Date: ${issued_date}`);
            doc.text(`Due Date: ${due_date}`);
            doc.moveDown();
            doc.text('Thank you for your business.', { align: 'center' });

            doc.end();

            await sendEmail({
                to: recipient.email,
                subject: `New Invoice #${invoiceId} - Everest Law Chamber`,
                text: `Hello ${recipient.name},\n\nA new invoice has been generated for your ${case_id ? 'case' : 'appointment'}.\n\nAmount: Rs. ${Number(amount).toFixed(2)}\nDue Date: ${due_date}\n\nPlease see the attached PDF for details.`,
                attachmentPath: pdfPath
            });

            // Cleanup
            setTimeout(() => { if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); }, 5000);
        }

        res.status(201).json({ success: true, message: 'Invoice created and email sent', invoiceId });

    } catch (err) {
        console.error('Billing Error:', err);
        res.status(500).json({ success: false, message: 'Error processing billing' });
    }
});

// -------------------- 2. List All Invoices -------------------- //
router.get('/', verifyToken, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching invoices' });
    }
});

// -------------------- 3. Record a Payment -------------------- //
router.post('/:id/pay', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    const { paid_by, amount, method, payment_date } = req.body;

    try {
        await db.query(
            `INSERT INTO payments (invoice_id, paid_by, recorded_by, amount, method, payment_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [id, paid_by, req.user.id, amount, method, payment_date]
        );

        const [sumResults] = await db.query('SELECT SUM(amount) as totalPaid FROM payments WHERE invoice_id = ?', [id]);
        const totalPaid = sumResults[0].totalPaid || 0;

        const [invoiceResults] = await db.query('SELECT amount FROM invoices WHERE id = ?', [id]);
        const invoiceTotal = Number(invoiceResults[0].amount);

        let newStatus = totalPaid >= invoiceTotal ? 'Paid' : (totalPaid > 0 ? 'Partially Paid' : 'Pending');

        await db.query('UPDATE invoices SET status = ? WHERE id = ?', [newStatus, id]);

        res.json({ success: true, message: 'Payment recorded', status: newStatus });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error recording payment' });
    }
});

module.exports = router;