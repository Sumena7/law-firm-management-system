const mysql = require('mysql2');

// Create connection to MySQL
const connection = mysql.createConnection({
    host: 'localhost',           
    user: 'root',                
    password: 'Sumenawhat1#', 
    database: 'law_firm_system'     
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

module.exports = connection;
