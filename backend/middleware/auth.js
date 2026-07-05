const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        req.user = decoded;
        return next();
    } catch (error) {
        req.user = null;
        return next();
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    return next();
};

module.exports = { authenticate, authorize };
