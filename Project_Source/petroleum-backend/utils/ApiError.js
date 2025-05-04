/**
 * Custom API Error class
 * @extends Error
 */
class ApiError extends Error {
    /**
     * Creates an ApiError instance
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {object} [data=null] - Additional error data
     */
    constructor(message, statusCode, data = null) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError; 