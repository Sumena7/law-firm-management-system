require('dotenv').config();
const db = require('./db');
const express = require('express');
const cors = require('cors');

const app = express(); 
const port = 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Logging middleware to track requests in the terminal
app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    next();
});

// --- Route Imports ---
// Ensure the filename in your /routes folder matches 'adminRoutes.js' exactly
const adminRoutes = require('./routes/adminRoutes'); 
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes');
const caseRoutes = require('./routes/caseRoutes'); 
const documentRoutes = require('./routes/documentRoutes');
const billingRoutes = require('./routes/billingRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const summarizeRoute = require('./routes/summarizeRoute');
const statsRoutes = require('./routes/statsRoutes'); // Add this line

// --- Route Definitions ---

// 1. Admin Management (Staff creation and Lawyer authorization)
// This enables the endpoint: http://localhost:3000/api/admin/create-staff
app.use('/api/admin', adminRoutes); 

// 2. Authentication (Login/Register)
app.use('/api/auth', authRoutes);

// 3. Core Legal Modules
app.use('/api/clients', clientRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/invoices', billingRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard-summary', statsRoutes);
// This allows the browser to actually open the PDFs
app.use('/uploads', express.static('uploads'));

// 4. AI/Utility Features
app.use('/api/summarize', summarizeRoute);

// --- General Routes ---

// Test route to check if server is alive
app.get('/', (req, res) => {
    res.send('Server is running');
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Admin routes active at /api/admin`);
});