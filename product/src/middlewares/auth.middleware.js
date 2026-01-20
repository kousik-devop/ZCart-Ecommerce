const jwt = require('jsonwebtoken');

const createAuthMiddleware = (roles = ['user']) => {
    return function authMiddleware(req, res, next) {
        const token =
            req.cookies?.user_token ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (process.env.NODE_ENV === 'test') {
                // eslint-disable-next-line no-console
                console.log('AUTH DEBUG: token:', token ? token.slice(0,10) + '...' : token, 'secret:', process.env.JWT_SECRET);
            }

            if (!roles.includes(decoded.role)) {
                return res.status(403).json({
                    message: 'Forbidden: Insufficient role'
                });
            }

            req.user = decoded;
            
            next();

        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};

module.exports = { createAuthMiddleware };
