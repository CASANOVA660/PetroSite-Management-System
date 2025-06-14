const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('../../../utils/logger');
const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const { simpleEmbedding } = require('./retrievalService');
const { Pinecone } = require('@pinecone-database/pinecone');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Get environment variables for Pinecone
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'petroleum-rag-index';

// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

// Define file types to index
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.md', '.json', '.yml', '.yaml'];
const DOCS_EXTENSIONS = ['.md', '.txt', '.pdf', '.docx', '.doc', '.rtf'];

// Define directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'logs', 'public', 'tmp'];

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

        pineconeIndex = pineconeClient.index(PINECONE_INDEX_NAME);
        return pineconeIndex;
    } catch (error) {
        logger.error(`Error initializing Pinecone: ${error.message}`);
        throw new Error(`Failed to initialize Pinecone: ${error.message}`);
    }
}

/**
 * Recursively scan a directory for code and documentation files
 * @param {string} dir - Directory to scan
 * @returns {Promise<Array<string>>} - Array of file paths
 */
const scanDirectory = async (dir) => {
    let results = [];
    try {
        const files = await readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await stat(filePath);

            if (stats.isDirectory()) {
                // Skip excluded directories
                if (EXCLUDE_DIRS.includes(file)) continue;

                // Recursively scan subdirectories
                const subResults = await scanDirectory(filePath);
                results = results.concat(subResults);
            } else {
                // Check if file extension is in our list
                const ext = path.extname(file).toLowerCase();
                if (CODE_EXTENSIONS.includes(ext) || DOCS_EXTENSIONS.includes(ext)) {
                    results.push(filePath);
                }
            }
        }
    } catch (error) {
        logger.error(`Error scanning directory ${dir}: ${error.message}`);
    }

    return results;
};

/**
 * Read and process a file for indexing
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - File content and metadata
 */
const processFile = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const isCode = CODE_EXTENSIONS.includes(ext);
        const isDoc = DOCS_EXTENSIONS.includes(ext);

        // Read file content
        const buffer = await readFile(filePath);
        let content = '';

        // Process different file types
        if (['.pdf', '.docx', '.doc'].includes(ext)) {
            // For simplicity, we'll just extract text from these files
            // In a real implementation, you'd use specific libraries for each format
            content = `File content from ${filePath} (binary file)`;
        } else {
            // Text files
            content = buffer.toString('utf8');
        }

        return {
            path: filePath,
            filename: path.basename(filePath),
            extension: ext,
            type: isCode ? 'code' : 'documentation',
            content,
            metadata: {
                fileSize: buffer.length,
                lastModified: (await stat(filePath)).mtime
            }
        };
    } catch (error) {
        logger.error(`Error processing file ${filePath}: ${error.message}`);
        return null;
    }
};

/**
 * Split file content into chunks for processing
 * @param {string} content - File content
 * @param {number} chunkSize - Size of each chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {Array<string>} - Array of content chunks
 */
const splitIntoChunks = (content, chunkSize = 1000, overlap = 200) => {
    const chunks = [];

    if (content.length <= chunkSize) {
        chunks.push(content);
        return chunks;
    }

    let startIndex = 0;
    while (startIndex < content.length) {
        const endIndex = Math.min(startIndex + chunkSize, content.length);
        chunks.push(content.slice(startIndex, endIndex));
        startIndex = endIndex - overlap;

        if (startIndex >= content.length) break;
    }

    return chunks;
};

/**
 * Store embeddings directly in Pinecone
 * @param {string} content - Content to embed
 * @param {object} metadata - Metadata for the vector
 * @returns {Promise<string>} - Vector ID
 */
async function storeEmbeddingInPinecone(content, metadata) {
    try {
        if (!pineconeIndex) {
            await initPinecone();
        }

        // Generate embedding
        const embedding = simpleEmbedding(content);

        // Create a unique ID
        const vectorId = new mongoose.Types.ObjectId().toString();

        // Store in Pinecone
        await pineconeIndex.upsert([{
            id: vectorId,
            values: embedding,
            metadata: metadata
        }]);

        return vectorId;
    } catch (error) {
        logger.error(`Error storing embedding in Pinecone: ${error.message}`);
        throw new Error(`Failed to store embedding: ${error.message}`);
    }
}

/**
 * Index a project's code and documentation
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} - Indexing statistics
 */
const indexProjectCode = async (projectRoot) => {
    try {
        logger.info(`Starting code indexing for project at ${projectRoot}`);

        // Scan directory for files
        const filePaths = await scanDirectory(projectRoot);
        logger.info(`Found ${filePaths.length} files to index`);

        // Process statistics
        const stats = {
            totalFiles: filePaths.length,
            processedFiles: 0,
            indexedChunks: 0,
            errors: 0,
            startTime: Date.now()
        };

        // Process each file
        for (const filePath of filePaths) {
            try {
                const fileData = await processFile(filePath);
                if (!fileData) {
                    stats.errors++;
                    continue;
                }

                // Split content into chunks and process
                const chunks = splitIntoChunks(fileData.content);
                const relativePath = path.relative(projectRoot, filePath);

                // Store each chunk directly in Pinecone
                for (let i = 0; i < chunks.length; i++) {
                    const chunkContent = chunks[i];
                    const metadata = {
                        filename: fileData.filename,
                        path: relativePath,
                        title: `${fileData.filename} (${i + 1}/${chunks.length})`,
                        type: fileData.type,
                        content: chunkContent,
                        chunkIndex: i,
                        fileType: fileData.extension.replace('.', '')
                    };

                    // Store embedding directly in Pinecone
                    await storeEmbeddingInPinecone(chunkContent, metadata);

                    stats.indexedChunks++;
                }

                stats.processedFiles++;
                logger.info(`Indexed file: ${relativePath} - ${chunks.length} chunks`);
            } catch (error) {
                logger.error(`Error indexing file ${filePath}: ${error.message}`);
                stats.errors++;
            }
        }

        stats.duration = Date.now() - stats.startTime;
        logger.info(`Completed code indexing. Processed ${stats.processedFiles} files in ${stats.duration}ms`);

        return stats;
    } catch (error) {
        logger.error(`Error indexing project code: ${error.message}`);
        throw error;
    }
};

module.exports = {
    indexProjectCode,
    scanDirectory,
    processFile
}; 