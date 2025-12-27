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

// -------------------- Create a new invoice -------------------- //
// Roles: admin, staff
router.post('/', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { case_id, amount, issued_date, due_date, status } = req.body;

    if (!case_id || !amount || !issued_date || !due_date) {
        return res.status(400).json({ success: false, message: 'case_id, amount, issued_date, and due_date are required' });
    }

    const invoiceStatus = status || 'Pending';

    try {
        // Prevent duplicate pending invoice for the same case
        const [existing] = await db.query(
            'SELECT * FROM invoices WHERE case_id = ? AND status = ?',
            [case_id, 'Pending']
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Pending invoice already exists for this case' });
        }

        // Insert invoice
        const [results] = await db.query(
            `INSERT INTO invoices (case_id, amount, issued_date, due_date, status, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [case_id, amount, issued_date, due_date, invoiceStatus]
        );

        const invoiceId = results.insertId;

        // Fetch invoice data
        const [invoiceResults] = await db.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        const invoice = invoiceResults[0];

        // Fetch client data
        const [clientResults] = await db.query(`
            SELECT c.name, c.email
            FROM cases
            JOIN clients c ON cases.client_id = c.id
            WHERE cases.id = ?
        `, [invoice.case_id]);

        const client = clientResults[0];

        if (client) {
            // Generate PDF in temp directory
            const tempDir = path.join(os.tmpdir(), `invoice_${invoiceId}`);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const pdfPath = path.join(tempDir, `Invoice_${invoiceId}.pdf`);

            const invoiceAmount = Number(invoice.amount); // Ensure numeric

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(fs.createWriteStream(pdfPath));

            doc.fontSize(20).text('Law Firm Invoice', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
            doc.text(`Case ID: ${invoice.case_id}`);
            doc.text(`Amount: $${invoiceAmount.toFixed(2)}`);
            doc.text(`Issued Date: ${invoice.issued_date}`);
            doc.text(`Due Date: ${invoice.due_date}`);
            doc.text(`Status: ${invoice.status}`);
            doc.moveDown();

            doc.text('Payments:', { underline: true });
            doc.text('No payments made yet.');

            doc.end();

            // Send email with PDF
            const emailText = `Hello ${client.name},

A new invoice has been created for your case (Case ID: ${invoice.case_id}).

Amount: $${invoiceAmount.toFixed(2)}
Issued Date: ${invoice.issued_date}
Due Date: ${invoice.due_date}
Status: ${invoice.status}

The invoice PDF is attached.`;

            await sendEmail(client.email, `New Invoice #${invoice.id}`, emailText, pdfPath);

            // Clean up temp PDF
            fs.rmSync(tempDir, { recursive: true, force: true });
        } else {
            console.warn('Client not found for invoice', invoiceId);
        }

        res.status(201).json({ success: true, message: 'Invoice created and email sent', invoiceId });

    } catch (err) {
        console.error('Error creating invoice:', err);
        res.status(500).json({ success: false, message: 'Error creating invoice' });
    }
});

// -------------------- List invoices -------------------- //
// Roles: admin/staff = all invoices, client = own invoices
router.get('/', verifyToken, async (req, res) => {
    let query = 'SELECT * FROM invoices';
    const params = [];

    if (req.user.role === 'client') {
        query += ' WHERE client_id = ?';
        params.push(req.user.id);
    }

    try {
        const [results] = await db.query(query, params);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ success: false, message: 'Error fetching invoices' });
    }
});

// -------------------- Get single invoice (with payments) -------------------- //
router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const [invoiceResults] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
        if (invoiceResults.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });

        const invoice = invoiceResults[0];

        if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const [paymentResults] = await db.query('SELECT * FROM payments WHERE invoice_id = ?', [id]);
        res.json({ success: true, data: { invoice, payments: paymentResults } });

    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ success: false, message: 'Error fetching invoice' });
    }
});
// -------------------- Record a payment -------------------- //
// Roles: admin/staff
router.post('/:id/pay', verifyToken, allowRoles('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    const { paid_by, amount, method, payment_date } = req.body;

    if (!paid_by || !amount || !method || !payment_date) {
        return res.status(400).json({ success: false, message: 'paid_by, amount, method, and payment_date are required' });
    }

    try {
        // recorded_by = the current logged-in user (admin/staff)
        const recorded_by = req.user.id;

        const [results] = await db.query(
            `INSERT INTO payments (invoice_id, paid_by, recorded_by, amount, method, payment_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [id, paid_by, recorded_by, amount, method, payment_date]
        );

        // Update invoice status
        const [sumResults] = await db.query('SELECT SUM(amount) as totalPaid FROM payments WHERE invoice_id = ?', [id]);
        const totalPaid = sumResults[0].totalPaid;

        const [invoiceResults] = await db.query('SELECT amount FROM invoices WHERE id = ?', [id]);
        const invoiceAmount = Number(invoiceResults[0].amount);

        let status = 'Pending';
        if (totalPaid >= invoiceAmount) status = 'Paid';
        else if (totalPaid > 0) status = 'Partially Paid';

        await db.query('UPDATE invoices SET status = ? WHERE id = ?', [status, id]);

        res.json({ 
            success: true, 
            message: 'Payment recorded', 
            paymentId: results.insertId, 
            invoiceStatus: status,
            recordedBy: recorded_by,
            paidBy: paid_by
        });

    } catch (err) {
        console.error('Error recording payment:', err);
        res.status(500).json({ success: false, message: 'Error recording payment' });
    }
});


module.exports = router;
