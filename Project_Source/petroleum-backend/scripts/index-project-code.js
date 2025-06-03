/**
 * Script to index project code for RAG
 * 
 * Run with: node scripts/index-project-code.js [path/to/project]
 */

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const codeIndexingService = require('../modules/rag/services/codeIndexingService');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Get project path from command line or use default
const projectPath = process.argv[2] || path.resolve(__dirname, '../..');

async function main() {
    try {
        console.log(`Starting code indexing for project at: ${projectPath}`);

        // Run indexing
        const stats = await codeIndexingService.indexProjectCode(projectPath);

        console.log('Indexing completed successfully:');
        console.log(`- Total files: ${stats.totalFiles}`);
        console.log(`- Processed files: ${stats.processedFiles}`);
        console.log(`- Indexed chunks: ${stats.indexedChunks}`);
        console.log(`- Errors: ${stats.errors}`);
        console.log(`- Duration: ${stats.duration}ms`);

        process.exit(0);
    } catch (error) {
        console.error('Error indexing project code:', error);
        process.exit(1);
    }
}

// Run the main function
main(); 