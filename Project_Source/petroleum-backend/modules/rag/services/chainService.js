const logger = require('../../../utils/logger');

/**
 * Make a chain for processing documents and queries
 * Note: This is a placeholder for LangChain compatibility but not used in the Ollama implementation
 */
const makeChain = () => {
    logger.info('Creating a simple chain for document processing');

    // Return an object with a simple call method for compatibility
    return {
        call: async (input) => {
            return {
                text: "This is a placeholder response. The actual processing is handled by the Ollama API."
            };
        }
    };
};

module.exports = {
    makeChain
}; 