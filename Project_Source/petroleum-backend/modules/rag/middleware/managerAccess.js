/**
 * Middleware to restrict access to manager role only
 * This extends the existing auth middleware
 */
const managerAccessMiddleware = (req, res, next) => {
    try {
        // Auth middleware already ran and set req.user
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié',
                error: 'Authentication required'
            });
        }

        // Check if user has manager role (case insensitive)
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';

        if (userRole !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Seuls les managers peuvent accéder à cette fonctionnalité.',
                error: 'Permission denied'
            });
        }

        // User is a manager, proceed to the next middleware/controller
        next();
    } catch (err) {
        console.error('Manager access middleware error:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des permissions',
            error: err.message
        });
    }
};

module.exports = managerAccessMiddleware; 