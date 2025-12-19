const jwt = require('jsonwebtoken');
const JWT_SECRET = 'jwt_secret_key'; // must match the secret in authRoutes.js

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']; // get header
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // verify token
        req.user = decoded; // attach payload to req.user
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

module.exports = { verifyToken };


