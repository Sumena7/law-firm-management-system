const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']; // look for token in headers
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const JWT_SECRET = 'your_jwt_secret_key'; // must match authRoutes.js
        const decoded = jwt.verify(token, JWT_SECRET); // ✅ verify the token
        req.user = decoded; // attach user info to the request object
        next(); // move to the next middleware or route
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}

module.exports = { verifyToken };
