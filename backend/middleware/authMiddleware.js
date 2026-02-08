const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; 

/**
 * Middleware to verify JWT token and attach user info to req.user
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']; // Expecting "Bearer <token>"
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verify token

        
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };

        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

module.exports = { verifyToken };



