const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
    {
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RagDocument',
            required: true
        },
        chunkIndex: {
            type: Number,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        metadata: {
            pageNumber: Number,
            section: String,
            title: String,
            type: String
        },
        embedding: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: null
        },
        // This field will store the vector database ID for this chunk
        vectorId: {
            type: String,
            default: null
        },
        vectorDbSource: {
            type: String,
            enum: ['pinecone', 'internal', 'other'],
            default: 'pinecone'
        },
        vectorStatus: {
            type: String,
            enum: ['pending', 'embedded', 'failed'],
            default: 'pending'
        },
        embeddingModel: {
            type: String,
            default: 'text-embedding-3-small'
        }
    },
    {
        timestamps: true
    }
);

// Create indexes for faster querying
documentChunkSchema.index({ document: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ vectorId: 1 });
documentChunkSchema.index({ vectorStatus: 1 });

module.exports = mongoose.model('DocumentChunk', documentChunkSchema); 