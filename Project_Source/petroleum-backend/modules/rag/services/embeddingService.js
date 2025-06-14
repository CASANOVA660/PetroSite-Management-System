const { Pinecone } = require('@pinecone-database/pinecone');
const DocumentChunk = require('../models/DocumentChunk');
const Document = require('../models/Document');
const logger = require('../../../utils/logger');
const { simpleEmbedding } = require('./retrievalService');

// Get environment variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'petroleum-rag-index';
const EMBEDDING_DIMENSION = 1024; // Updated to match existing index dimension

// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initialize Pinecone client and index
 */
async function initPinecone() {
    try {
        if (!pineconeClient) {
            pineconeClient = new Pinecone({
                apiKey: PINECONE_API_KEY
            });
        }

        try {
            // Check if index exists, if not create it
            const indexes = await pineconeClient.listIndexes();
            const indexNames = Array.isArray(indexes) ? indexes : Object.keys(indexes);

            const indexExists = indexNames.includes(PINECONE_INDEX_NAME);

            if (!indexExists) {
                console.log(`Creating Pinecone index: ${PINECONE_INDEX_NAME}`);

                try {
                    await pineconeClient.createIndex({
                        name: PINECONE_INDEX_NAME,
                        dimension: EMBEDDING_DIMENSION,
                        metric: 'cosine',
                        spec: {
                            serverless: {
                                cloud: 'aws',
                                region: 'us-east-1' // Changed to us-east-1 which is typically supported on free plans
                            }
                        }
                    });

                    // Wait for index to be ready
                    console.log('Waiting for index to be ready...');
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    console.log('Index should be ready now');
                } catch (createError) {
                    console.error('Error creating Pinecone index:', createError);
                    throw new Error(`Failed to create Pinecone index: ${createError.message}`);
                }
            } else {
                console.log(`Using existing Pinecone index: ${PINECONE_INDEX_NAME}`);
            }
        } catch (listError) {
            console.error('Error listing Pinecone indexes:', listError);
            // Continue anyway to try to get the index
            console.log(`Attempting to use index: ${PINECONE_INDEX_NAME}`);
        }

        try {
            pineconeIndex = pineconeClient.index(PINECONE_INDEX_NAME);
            // Test connection to the index
            await pineconeIndex.describeIndexStats();
            console.log('Successfully connected to Pinecone index');
            return pineconeIndex;
        } catch (indexError) {
            console.error('Error connecting to Pinecone index:', indexError);
            throw new Error(`Failed to connect to Pinecone index: ${indexError.message}`);
        }
    } catch (error) {
        console.error('Error initializing Pinecone:', error);
        throw new Error(`Failed to initialize Pinecone: ${error.message}`);
    }
}

/**
 * Generate embedding for a document chunk
 * @param {Object} chunk - Document chunk
 * @returns {Promise<Object>} - Updated chunk with embedding
 */
async function generateEmbedding(chunk) {
    try {
        if (!chunk || !chunk.content) {
            throw new Error('Invalid chunk data');
        }

        // Generate embedding
        const embeddingVector = await simpleEmbedding(chunk.content);

        // Update chunk with embedding - store as array directly
        const updatedChunk = await DocumentChunk.findByIdAndUpdate(
            chunk._id,
            {
                embedding: embeddingVector,  // Store as array directly
                vectorStatus: 'embedded',
                embeddingModel: 'simpleEmbedding'
            },
            { new: true }
        );

        return updatedChunk;
    } catch (error) {
        logger.error(`Error generating embedding for chunk ${chunk._id}: ${error.message}`);

        // Update chunk status to failed
        await DocumentChunk.findByIdAndUpdate(chunk._id, {
            vectorStatus: 'failed',
            error: error.message
        });

        throw error;
    }
}

/**
 * Store embeddings in Pinecone
 * @param {Array} chunks - Array of document chunks with embeddings
 * @returns {Promise<Array>} - Array of updated chunks with vector IDs
 */
async function storeEmbeddingsInPinecone(chunks) {
    try {
        if (!pineconeIndex) {
            await initPinecone();
        }

        const vectors = chunks.map(chunk => {
            // Convert metadata to a format Pinecone can handle
            // Pinecone requires metadata to be a flat object with string, number, or boolean values
            const flattenedMetadata = {
                content: chunk.content,
                documentId: chunk.document.toString(),
                chunkIndex: chunk.chunkIndex
            };

            // Add any additional metadata that might be available
            if (chunk.metadata) {
                if (typeof chunk.metadata === 'object') {
                    // Only add primitive values to the metadata
                    Object.entries(chunk.metadata).forEach(([key, value]) => {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            flattenedMetadata[key] = value;
                        }
                    });
                }
            }

            // Ensure embedding is an array, not an object
            let embeddingArray;
            if (chunk.embedding) {
                if (Array.isArray(chunk.embedding)) {
                    embeddingArray = chunk.embedding;
                } else if (typeof chunk.embedding === 'object') {
                    // Convert object to array if needed
                    embeddingArray = [];
                    // If embedding is stored as {0: value, 1: value, ...}
                    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
                        const key = i.toString();
                        embeddingArray[i] = chunk.embedding[key] || 0;
                    }
                } else {
                    logger.error(`Invalid embedding format for chunk ${chunk._id}`);
                    embeddingArray = new Array(EMBEDDING_DIMENSION).fill(0);
                }
            } else {
                logger.error(`Missing embedding for chunk ${chunk._id}`);
                embeddingArray = new Array(EMBEDDING_DIMENSION).fill(0);
            }

            return {
                id: chunk._id.toString(),
                values: embeddingArray,
                metadata: flattenedMetadata
            };
        });

        logger.info(`Preparing to upsert ${vectors.length} vectors to Pinecone`);

        // Upsert vectors in batches of 100
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await pineconeIndex.upsert(batch);
            logger.info(`Upserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(vectors.length / batchSize)}`);
        }

        // Update chunks with vector IDs
        const updatedChunks = [];
        for (const chunk of chunks) {
            const updatedChunk = await DocumentChunk.findByIdAndUpdate(
                chunk._id,
                {
                    vectorId: chunk._id.toString(),
                    vectorDbSource: 'pinecone'
                },
                { new: true }
            );
            updatedChunks.push(updatedChunk);
        }

        return updatedChunks;
    } catch (error) {
        logger.error(`Error storing embeddings in Pinecone: ${error.message}`);
        throw new Error(`Failed to store embeddings: ${error.message}`);
    }
}

/**
 * Search for similar vectors in Pinecone
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of search results
 */
async function searchVectors(query, options = {}) {
    try {
        if (!pineconeIndex) {
            await initPinecone();
        }

        const {
            filter = {},
            topK = 5,
            includemetadata = true
        } = options;

        // Generate embedding for query
        const queryEmbedding = await simpleEmbedding(query);

        // Search Pinecone
        const results = await pineconeIndex.query({
            vector: queryEmbedding,
            topK,
            includemetadata,
            filter
        });

        return results.matches;
    } catch (error) {
        console.error('Error searching vectors:', error);
        throw new Error(`Failed to search vectors: ${error.message}`);
    }
}

/**
 * Process document chunks for a document
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Updated document
 */
async function processDocumentChunks(documentId) {
    try {
        logger.info(`Starting to process document chunks for document ${documentId}`);

        // Find all chunks for the document
        const chunks = await DocumentChunk.find({
            document: documentId,
            vectorStatus: 'pending'
        });

        logger.info(`Found ${chunks.length} pending chunks for document ${documentId}`);

        if (chunks.length === 0) {
            logger.info(`No pending chunks found for document ${documentId}`);

            // Check if the document exists and update its status if needed
            const document = await Document.findById(documentId);
            if (document && document.processingStatus !== 'embedded') {
                logger.info(`Updating document ${documentId} status to embedded`);
                return await Document.findByIdAndUpdate(
                    documentId,
                    { processingStatus: 'embedded' },
                    { new: true }
                );
            }
            return document;
        }

        // Generate embeddings for each chunk
        logger.info(`Generating embeddings for ${chunks.length} chunks`);
        const chunksWithEmbeddings = [];
        for (const chunk of chunks) {
            try {
                const updatedChunk = await generateEmbedding(chunk);
                chunksWithEmbeddings.push(updatedChunk);
                logger.info(`Generated embedding for chunk ${chunk._id} (${chunksWithEmbeddings.length}/${chunks.length})`);
            } catch (chunkError) {
                logger.error(`Error generating embedding for chunk ${chunk._id}: ${chunkError.message}`);
                // Continue with other chunks even if one fails
            }
        }

        if (chunksWithEmbeddings.length === 0) {
            logger.error(`Failed to generate embeddings for all chunks of document ${documentId}`);
            throw new Error('Failed to generate embeddings for all chunks');
        }

        // Store embeddings in Pinecone
        logger.info(`Storing ${chunksWithEmbeddings.length} embeddings in Pinecone`);
        await storeEmbeddingsInPinecone(chunksWithEmbeddings);
        logger.info(`Successfully stored embeddings in Pinecone for document ${documentId}`);

        // Update document status
        const document = await Document.findByIdAndUpdate(
            documentId,
            {
                processingStatus: 'embedded',
                chunkCount: chunksWithEmbeddings.length
            },
            { new: true }
        );
        logger.info(`Updated document ${documentId} status to embedded`);

        return document;
    } catch (error) {
        logger.error(`Error processing document chunks for ${documentId}: ${error.message}`);

        // Update document status to failed
        await Document.findByIdAndUpdate(documentId, {
            processingStatus: 'failed',
            processingError: error.message
        });

        throw error;
    }
}

/**
 * Delete document vectors from Pinecone
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteDocumentVectors(documentId) {
    try {
        if (!pineconeIndex) {
            await initPinecone();
        }

        // Find all chunks for the document
        const chunks = await DocumentChunk.find({ document: documentId });

        if (chunks.length === 0) {
            return true;
        }

        // Get vector IDs
        const vectorIds = chunks
            .filter(chunk => chunk.vectorId)
            .map(chunk => chunk.vectorId);

        if (vectorIds.length > 0) {
            // Delete vectors from Pinecone
            await pineconeIndex.deleteMany(vectorIds);
        }

        // Delete chunks from database
        await DocumentChunk.deleteMany({ document: documentId });

        return true;
    } catch (error) {
        console.error(`Error deleting document vectors for ${documentId}:`, error);
        throw new Error(`Failed to delete document vectors: ${error.message}`);
    }
}

/**
 * Create a document chunk
 * @param {Object} chunkData - Chunk data
 * @returns {Promise<Object>} - Created chunk
 */
async function createDocumentChunk(chunkData) {
    try {
        // Create the chunk
        const chunk = new DocumentChunk({
            document: chunkData.document,
            content: chunkData.content,
            chunkIndex: chunkData.chunkIndex,
            metadata: chunkData.metadata || {},
            vectorStatus: 'pending'
        });

        await chunk.save();

        // Generate embedding for the chunk
        const updatedChunk = await generateEmbedding(chunk);

        // Store in Pinecone
        await storeEmbeddingsInPinecone([updatedChunk]);

        return updatedChunk;
    } catch (error) {
        logger.error(`Error creating document chunk: ${error.message}`);
        throw new Error(`Failed to create document chunk: ${error.message}`);
    }
}

module.exports = {
    initPinecone,
    generateEmbedding,
    storeEmbeddingsInPinecone,
    searchVectors,
    processDocumentChunks,
    deleteDocumentVectors,
    createDocumentChunk
}; 