const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

/* -------------------- Create a new invoice -------------------- */
// Roles: admin, staff
router.post('/', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { case_id, amount, issued_date, due_date, status } = req.body;

    if (!case_id || !amount || !issued_date || !due_date) {
        return res.status(400).json({ success: false, message: 'case_id, amount, issued_date, and due_date are required' });
    }

    const invoiceStatus = status || 'Pending';
    const query = `
        INSERT INTO invoices (case_id, amount, issued_date, due_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    db.query(query, [case_id, amount, issued_date, due_date, invoiceStatus], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error creating invoice' });
        res.status(201).json({ success: true, message: 'Invoice created', invoiceId: results.insertId });
    });
});

/* -------------------- List invoices -------------------- */
// Roles: admin/staff = all invoices, client = own invoices
router.get('/', verifyToken, (req, res) => {
    let query = 'SELECT * FROM invoices';
    let params = [];

    if (req.user.role === 'client') {
        query += ' WHERE client_id = ?';
        params.push(req.user.id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching invoices' });
        res.json({ success: true, data: results });
    });
});

/* -------------------- Get single invoice (with payments) -------------------- */
router.get('/:id', verifyToken, (req, res) => {
    const { id } = req.params;

    // Fetch invoice
    db.query('SELECT * FROM invoices WHERE id = ?', [id], (err, invoiceResults) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching invoice' });
        if (invoiceResults.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });

        const invoice = invoiceResults[0];

        // Clients can only view their own invoice
        if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Fetch payments
        db.query('SELECT * FROM payments WHERE invoice_id = ?', [id], (err, paymentResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Error fetching payments' });

            res.json({ success: true, data: { invoice, payments: paymentResults } });
        });
    });
});

/* -------------------- Record a payment -------------------- */
// Roles: admin/staff
router.post('/:id/pay', verifyToken, allowRoles('admin', 'staff'), (req, res) => {
    const { id } = req.params;
    const { paid_by, amount, method, payment_date } = req.body;

    if (!paid_by || !amount || !method || !payment_date) {
        return res.status(400).json({ success: false, message: 'paid_by, amount, method, and payment_date are required' });
    }

    // Record payment
    const query = `
        INSERT INTO payments (invoice_id, paid_by, amount, method, payment_date, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    db.query(query, [id, paid_by, amount, method, payment_date], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error recording payment' });

        // Update invoice status
        db.query('SELECT SUM(amount) as totalPaid FROM payments WHERE invoice_id = ?', [id], (err, sumResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Error calculating payments' });

            const totalPaid = sumResults[0].totalPaid;
            db.query('SELECT amount FROM invoices WHERE id = ?', [id], (err, invoiceResults) => {
                if (err) return res.status(500).json({ success: false, message: 'Error fetching invoice' });

                const invoiceAmount = invoiceResults[0].amount;
                let status = 'Pending';
                if (totalPaid >= invoiceAmount) status = 'Paid';
                else if (totalPaid > 0) status = 'Partially Paid';

                db.query('UPDATE invoices SET status = ? WHERE id = ?', [status, id], (err) => {
                    if (err) return res.status(500).json({ success: false, message: 'Error updating invoice status' });
                    res.json({ success: true, message: 'Payment recorded', paymentId: results.insertId, invoiceStatus: status });
                });
            });
        });
    });
});
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

//* -------------------- Generate PDF invoice -------------------- */
// Roles: admin/staff or client (only own invoices)
router.get('/:id/pdf', verifyToken, (req, res) => {
    const { id } = req.params;

    // Fetch invoice
    db.query('SELECT * FROM invoices WHERE id = ?', [id], (err, invoiceResults) => {
        if (err || invoiceResults.length === 0) 
            return res.status(404).json({ success: false, message: 'Invoice not found' });

        const invoice = invoiceResults[0];

        // Clients can only download their own invoices
        if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Fetch payments
        db.query('SELECT * FROM payments WHERE invoice_id = ?', [id], (err, paymentResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Error fetching payments' });

            // Create PDF
            const doc = new PDFDocument({ margin: 50 });
            const filename = `Invoice_${invoice.id}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            doc.pipe(res);

            // --- PDF Content ---
            doc.fontSize(20).text('Law Firm Invoice', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
            doc.text(`Case ID: ${invoice.case_id}`);
            doc.text(`Amount: $${invoice.amount.toFixed(2)}`);
            doc.text(`Issued Date: ${invoice.issued_date}`);
            doc.text(`Due Date: ${invoice.due_date}`);
            doc.text(`Status: ${invoice.status}`);
            doc.moveDown();

            doc.text('Payments:', { underline: true });
            if (paymentResults.length === 0) {
                doc.text('No payments made yet.');
            } else {
                paymentResults.forEach(p => {
                    doc.text(`- Paid by User ID ${p.paid_by}, Amount: $${p.amount.toFixed(2)}, Method: ${p.method}, Date: ${p.payment_date}`);
                });
            }

            doc.end();
        });
    });
});


module.exports = router;
