/**
 * Wrapper pour gérer les erreurs dans les fonctions asynchrones des contrôleurs
 * Élimine le besoin de try/catch dans chaque contrôleur
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            console.error('Caught error in async function:', err);
            next(err);
        });
    };
};

module.exports = catchAsync; 