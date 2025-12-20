
const db = require('./db');
const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    next();
});

const authRoutes = require('./routes/authRoutes');
const clientRoutes=require('./routes/clientRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes');
const caseRoutes = require('./routes/caseRoutes'); 
const documentRoutes = require('./routes/documentRoutes');




app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
