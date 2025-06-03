const mongoose = require('mongoose');

const ragChatSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: 'New Chat'
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RagMessage'
        },
        context: {
            type: String,
            default: 'You are a helpful AI assistant that answers questions based on provided context and documents.'
        },
        documents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RagDocument'
        }],
        settings: {
            temperature: {
                type: Number,
                default: 0.7,
                min: 0,
                max: 2
            },
            model: {
                type: String,
                default: 'gpt-4o',
                enum: ['gpt-3.5-turbo', 'gpt-4o']
            },
            maxTokens: {
                type: Number,
                default: 4000
            },
            retrievalMode: {
                type: String,
                enum: ['semantic', 'hybrid', 'keyword'],
                default: 'hybrid'
            },
            maxChunks: {
                type: Number,
                default: 10,
                min: 1,
                max: 20
            }
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Create indexes for faster querying
ragChatSchema.index({ user: 1, createdAt: -1 });
ragChatSchema.index({ title: 'text' });

module.exports = mongoose.model('RagChat', ragChatSchema); 