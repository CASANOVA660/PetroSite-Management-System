/**
 * Async handler middleware to avoid try-catch blocks in controllers
 * @param {Function} fn Controller function to wrap with try-catch
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 