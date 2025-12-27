const express = require('express');
const router = express.Router();
const db = require('../db'); // Goes up one level to find your db.js

router.get('/dashboard-summary', async (req, res) => {
    try {
        // SQL queries to count rows in each table
        const casesQuery = "SELECT COUNT(*) as count FROM cases";
        const clientsQuery = "SELECT COUNT(*) as count FROM clients";
        const lawyersQuery = "SELECT COUNT(*) as count FROM lawyers";
        const appointmentsQuery = "SELECT COUNT(*) as count FROM appointments";
        const billingQuery = "SELECT COUNT(*) as count FROM invoices"; // check if table name is 'billing' or 'invoices'
        const documentsQuery = "SELECT COUNT(*) as count FROM documents";

        // Execute all queries
        const [cases] = await db.query(casesQuery);
        const [clients] = await db.query(clientsQuery);
        const [lawyers] = await db.query(lawyersQuery);
        const [appointments] = await db.query(appointmentsQuery);
        const [bills] = await db.query(billingQuery);
        const [docs] = await db.query(documentsQuery);

        res.json({
            success: true,
            data: {
                totalCases: cases[0].count,
                totalClients: clients[0].count,
                totalLawyers: lawyers[0].count,
                totalAppointments: appointments[0].count,
                totalBills: bills[0].count,
                totalDocuments: docs[0].count
            }
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;