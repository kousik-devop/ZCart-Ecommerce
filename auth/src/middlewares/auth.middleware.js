const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.user_token;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = user; // ✅ REAL USER DOCUMENT
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
