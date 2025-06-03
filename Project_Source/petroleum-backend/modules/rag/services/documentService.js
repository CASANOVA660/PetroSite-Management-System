const fs = require('fs');
const path = require('path');
const util = require('util');
const pdfParse = require('pdf-parse');
const { htmlToText } = require('html-to-text');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

// Get chunking configuration from environment or use defaults
const CHUNK_SIZE = process.env.RAG_CHUNK_SIZE || 500;
const CHUNK_OVERLAP = process.env.RAG_CHUNK_OVERLAP || 50;

/**
 * Process and chunk a document
 * @param {Object} document - Document from the database
 * @returns {Promise<Object>} - Updated document
 */
async function processDocument(document) {
    try {
        // Update document status to processing
        await Document.findByIdAndUpdate(document._id, {
            processingStatus: 'processing',
            lastProcessed: new Date()
        });

        // Extract text based on document type
        const text = await extractTextFromDocument(document);

        // Split text into chunks
        const chunks = await splitTextIntoChunks(text, document._id);

        // Update document with chunk count
        const updatedDocument = await Document.findByIdAndUpdate(
            document._id,
            {
                processingStatus: 'embedded',
                chunkCount: chunks.length,
                lastProcessed: new Date()
            },
            { new: true }
        );

        return updatedDocument;
    } catch (error) {
        console.error(`Error processing document ${document._id}:`, error);

        // Update document status to failed
        await Document.findByIdAndUpdate(document._id, {
            processingStatus: 'failed',
            processingError: error.message,
            lastProcessed: new Date()
        });

        throw error;
    }
}

/**
 * Extract text from a document based on its type
 * @param {Object} document - Document from the database
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDocument(document) {
    try {
        const { fileType, file } = document;
        let text = '';

        // Handle different file types
        switch (fileType) {
            case 'pdf':
                text = await extractTextFromPdf(file.url);
                break;
            case 'txt':
                text = await fetchTextFile(file.url);
                break;
            case 'html':
                const htmlContent = await fetchTextFile(file.url);
                text = htmlToText(htmlContent, {
                    wordwrap: false,
                    preserveNewlines: true
                });
                break;
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }

        return text;
    } catch (error) {
        console.error(`Error extracting text from document ${document._id}:`, error);
        throw new Error(`Failed to extract text: ${error.message}`);
    }
}

/**
 * Extract text from a PDF file
 * @param {string} url - URL of the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPdf(url) {
    try {
        // Download PDF file or use local path
        const pdfBuffer = await downloadFile(url);

        // Parse PDF content
        const pdfData = await pdfParse(pdfBuffer);

        return pdfData.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Fetch text from a URL
 * @param {string} url - URL of the text file
 * @returns {Promise<string>} - Text content
 */
async function fetchTextFile(url) {
    try {
        // If URL is local path, read file directly
        if (!url.startsWith('http')) {
            const readFile = util.promisify(fs.readFile);
            const filePath = path.resolve(process.cwd(), url);
            const data = await readFile(filePath, 'utf8');
            return data;
        }

        // Otherwise, fetch from remote URL
        const response = await fetch(url);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching text file:', error);
        throw new Error(`Failed to fetch text file: ${error.message}`);
    }
}

/**
 * Download a file from a URL
 * @param {string} url - URL of the file
 * @returns {Promise<Buffer>} - File buffer
 */
async function downloadFile(url) {
    try {
        // If URL is local path, read file directly
        if (!url.startsWith('http')) {
            const readFile = util.promisify(fs.readFile);
            const filePath = path.resolve(process.cwd(), url);
            return await readFile(filePath);
        }

        // Otherwise, fetch from remote URL
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw new Error(`Failed to download file: ${error.message}`);
    }
}

/**
 * Split text into chunks
 * @param {string} text - Text to split
 * @param {string} documentId - Document ID
 * @returns {Promise<Array>} - Array of created chunks
 */
async function splitTextIntoChunks(text, documentId) {
    try {
        // Create text splitter
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP
        });

        // Split text into chunks
        const rawChunks = await splitter.createDocuments([text]);

        // Create document chunks in database
        const chunks = [];

        for (let i = 0; i < rawChunks.length; i++) {
            const chunk = await DocumentChunk.create({
                document: documentId,
                chunkIndex: i,
                content: rawChunks[i].pageContent,
                metadata: {
                    ...rawChunks[i].metadata
                },
                vectorStatus: 'pending'
            });

            chunks.push(chunk);
        }

        return chunks;
    } catch (error) {
        console.error(`Error splitting text for document ${documentId}:`, error);
        throw new Error(`Failed to split text: ${error.message}`);
    }
}

module.exports = {
    processDocument,
    extractTextFromDocument,
    splitTextIntoChunks
}; 