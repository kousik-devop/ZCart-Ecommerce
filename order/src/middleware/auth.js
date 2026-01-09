const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'test-secret';
const cookieName = process.env.JWT_COOKIE_NAME || 'token';

function authMiddleware(req, res, next) {
  try {
    let token;
    if (req.cookies && req.cookies[cookieName]) {
      token = req.cookies[cookieName];
    } else if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1];
    }

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, secret);
    // Normalize user object expected by controllers/tests
    req.user = { id: payload.id || payload.userId || payload.userId, ...(payload || {}) };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
}

module.exports = authMiddleware;
