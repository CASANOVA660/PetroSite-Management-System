const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['ACCOUNT_ACTIVATION', 'USER_CREATED', 'ACTION_ASSIGNED', 'ACTION_STATUS_CHANGED', 'ACTION_DELETED', 'ACTION_ASSIGNED_FOLLOWUP', 'ACTION_CONTENT_CHANGED']
    },
    message: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 