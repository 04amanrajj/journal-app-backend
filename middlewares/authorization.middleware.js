const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
require("dotenv").config();

exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Authorization header missing or malformed');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        console.log('User authenticated:', req.user);
        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};