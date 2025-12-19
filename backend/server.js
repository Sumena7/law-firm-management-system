const authRoutes = require('./routes/authRoutes');
const clientRoutes=require('./routes/clientRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes');


const db = require('./db');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); // allows server to parse JSON requests
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/lawyers', lawyerRoutes);


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
