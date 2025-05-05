const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: function () {
                // Content is required only if there are no attachments
                return this.attachments.length === 0;
            },
            trim: true,
            default: ""
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        attachments: [
            {
                url: {
                    type: String,
                    required: true
                },
                type: {
                    type: String,
                    enum: ['image', 'document', 'video', 'audio'],
                    required: true
                },
                filename: String,
                size: Number
            }
        ]
    },
    {
        timestamps: true
    }
);

// Create indexes for faster querying
messageSchema.index({ chat: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema); 