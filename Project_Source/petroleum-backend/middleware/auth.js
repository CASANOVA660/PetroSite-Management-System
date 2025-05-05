// petroleum-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token or invalid token format');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        error: 'Token manquant ou format invalide'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    console.log('Token extracted:', token);

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Erreur de configuration du serveur',
        error: 'JWT_SECRET not configured'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);

      // Set user info in request
      req.user = {
        id: decoded.userId,
        _id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.nom,
        nom: decoded.nom
      };

      // Check if the route is for creating users and user is not a Manager
      if (req.path === '/api/users' && req.method === 'POST' && decoded.role !== 'Manager') {
        return res.status(403).json({
          success: false,
          message: 'Seul le Manager peut créer des utilisateurs',
          error: 'Permission denied'
        });
      }

      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expirée, veuillez vous reconnecter',
          error: 'Token expired'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        error: 'Token invalide'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié',
      error: err.message
    });
  }
};

module.exports = authMiddleware;