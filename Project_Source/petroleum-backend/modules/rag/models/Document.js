const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        fileType: {
            type: String,
            enum: ['pdf', 'docx', 'txt', 'html', 'other'],
            required: true
        },
        source: {
            type: String,
            required: true,
            trim: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        file: {
            url: {
                type: String,
                required: true
            },
            publicId: String,
            size: Number
        },
        processingStatus: {
            type: String,
            enum: ['pending', 'processing', 'embedded', 'failed'],
            default: 'pending'
        },
        processingError: {
            type: String,
            default: null
        },
        chunkCount: {
            type: Number,
            default: 0
        },
        metadata: {
            type: Map,
            of: String,
            default: {}
        },
        lastProcessed: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Create indexes for faster querying
documentSchema.index({ title: 'text', description: 'text' });
documentSchema.index({ processingStatus: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ fileType: 1 });

module.exports = mongoose.model('RagDocument', documentSchema); 