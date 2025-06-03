const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../../../utils/logger');

// Get environment variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'petroleum-rag-index';

/**
 * Simple free text embedding function using term frequency
 * @param {string} text - Text to embed
 * @returns {Array<number>} - Embedding vector (simple term frequency)
 */
const simpleEmbedding = (text) => {
    // Normalize text: lowercase and remove punctuation
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');

    // Create a basic word frequency map
    const words = normalizedText.split(/\s+/);
    const wordSet = new Set(words);
    const uniqueWords = Array.from(wordSet);

    // Create a simple embedding based on word frequency
    const embedding = new Array(384).fill(0); // Use 384 dimensions

    // Fill the embedding vector with simple hashed values
    for (let i = 0; i < uniqueWords.length; i++) {
        const word = uniqueWords[i];
        const frequency = words.filter(w => w === word).length / words.length;

        // Simple hash function to determine position in vector
        const hashCode = word.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        const position = Math.abs(hashCode) % embedding.length;
        embedding[position] = frequency;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < embedding.length; i++) {
            embedding[i] = embedding[i] / magnitude;
        }
    }

    return embedding;
};

/**
 * Retrieve relevant documents from vector store
 * @param {string} query - The user query
 * @param {number} topK - Number of documents to retrieve
 * @returns {Promise<Array>} - Array of relevant documents
 */
const retrieveRelevantDocuments = async (query, topK = 5) => {
    try {
        const startTime = Date.now();

        // Generate simple embedding for the query
        const queryEmbedding = simpleEmbedding(query);

        // Get the index
        const pinecone = new Pinecone({
            apiKey: PINECONE_API_KEY,
        });
        const index = pinecone.Index(PINECONE_INDEX_NAME);

        // Search for similar documents
        const results = await index.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });

        // Convert Pinecone results to document format
        const documents = results.matches.map(match => ({
            pageContent: match.metadata.content,
            metadata: {
                documentId: match.metadata.documentId,
                chunkId: match.id,
                title: match.metadata.title || 'Unknown Document'
            }
        }));

        const retrievalTime = Date.now() - startTime;
        logger.info(`Retrieved ${documents.length} documents in ${retrievalTime}ms`);

        return documents;
    } catch (error) {
        logger.error(`Error retrieving documents: ${error.message}`);
        return [];
    }
};

module.exports = {
    retrieveRelevantDocuments,
    simpleEmbedding
}; 