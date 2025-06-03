const mongoose = require('mongoose');

const ragMessageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RagChat',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        sources: [{
            document: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'RagDocument'
            },
            chunkIndex: Number,
            content: String,
            relevanceScore: Number
        }],
        metadata: {
            tokenCount: {
                prompt: Number,
                completion: Number,
                total: Number
            },
            processingTime: Number,
            modelUsed: String,
            retrievalMetrics: {
                totalChunksRetrieved: Number,
                topRelevanceScore: Number,
                retrievalTime: Number
            }
        },
        error: {
            code: String,
            message: String
        }
    },
    {
        timestamps: true
    }
);

// Create indexes for faster querying
ragMessageSchema.index({ chat: 1, createdAt: 1 });
ragMessageSchema.index({ 'sources.document': 1 });

module.exports = mongoose.model('RagMessage', ragMessageSchema); 