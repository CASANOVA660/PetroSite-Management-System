const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('JWT verification error:', err);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expirée, veuillez vous reconnecter'
                });
            }
            return res.status(403).json({
                success: false,
                message: 'Token invalide'
            });
        }

        // Ensure user object has both id and _id properties
        req.user = {
            ...decoded,
            id: decoded.userId,
            _id: decoded.userId // Make sure _id is set for compatibility
        };

        console.log('User object set in request:', req.user);

        next();
    });
};

module.exports = { authenticateToken }; 