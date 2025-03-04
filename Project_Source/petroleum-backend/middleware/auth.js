// petroleum-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accès refusé' });
    }

    console.log('Token reçu dans authMiddleware:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Utilisateur décodé:', decoded);

    req.user = decoded;

    // Check if the route is for creating users and user is not a Manager
    if (req.path === '/api/users' && req.method === 'POST' && decoded.role !== 'Manager') {
      return res.status(403).json({ error: 'Seul le Manager peut créer des utilisateurs' });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;