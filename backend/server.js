const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const db = require('./db');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); // allows server to parse JSON requests
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
