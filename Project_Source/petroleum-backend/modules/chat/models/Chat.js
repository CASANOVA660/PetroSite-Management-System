const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: null // Only required for group chats
        },
        isGroup: {
            type: Boolean,
            default: false
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        ],
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    },
    {
        timestamps: true
    }
);

// Create index for faster querying
chatSchema.index({ participants: 1 });

module.exports = mongoose.model('Chat', chatSchema); 