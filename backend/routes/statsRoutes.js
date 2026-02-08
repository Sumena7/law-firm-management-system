const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/dashboard-summary', async (req, res) => {
    try {
        const { period } = req.query;
        
        // Helper to create filter only if column exists
        const getFilter = (columnName) => {
            if (period === "Today") {
                return ` WHERE DATE(${columnName}) = CURDATE()`;
            } else if (period === "This Month") {
                return ` WHERE MONTH(${columnName}) = MONTH(CURDATE()) AND YEAR(${columnName}) = YEAR(CURDATE())`;
            }
            return ""; // All Time
        };


        const casesQuery = `SELECT COUNT(*) as count FROM cases ${getFilter('created_at')}`;
        const appointmentsQuery = `SELECT COUNT(*) as count FROM appointments ${getFilter('appointment_date')}`;
        const billingQuery = `SELECT COUNT(*) as count FROM invoices ${getFilter('created_at')}`;
        
        
        const clientsQuery = "SELECT COUNT(*) as count FROM clients";
        const lawyersQuery = "SELECT COUNT(*) as count FROM lawyers";
        const documentsQuery = "SELECT COUNT(*) as count FROM documents";

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
      
        console.error("STATS ROUTE CRASHED:", err.message);
        res.status(500).json({ success: false, message: "Database Error" });
    }
});

module.exports = router;