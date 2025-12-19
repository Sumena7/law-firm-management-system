function allowRoles(...roles) {
    return (req, res, next) => {
        // req.user comes from your verifyToken middleware
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
}

module.exports = { allowRoles };
