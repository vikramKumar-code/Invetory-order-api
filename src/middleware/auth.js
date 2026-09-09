const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.toLowerCase().startsWith('bearer')
    ) {
        const parts = req.headers.authorization.trim().split(/\s+/);
        if (parts.length === 2) {
            token = parts[1];
        }
    }

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route, token missing or invalid',
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_jwt_secret'
        );

        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token payload',
            });
        }

        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User belonging to this token no longer exists',
            });
        }

        next();
    } catch (error) {
        let message = 'Not authorized to access this route, invalid token';
        if (error.name === 'TokenExpiredError') {
            message = 'Session expired, please log in again';
        }

        return res.status(401).json({
            success: false,
            message,
        });
    }
};

module.exports = { protect };
