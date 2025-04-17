const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            // User notifications
            'ACCOUNT_ACTIVATION',
            'USER_CREATED',

            // Action notifications
            'ACTION_ASSIGNED',
            'ACTION_STATUS_CHANGED',
            'ACTION_DELETED',
            'ACTION_ASSIGNED_FOLLOWUP',
            'ACTION_CONTENT_CHANGED',

            // Task notifications
            'TASK_ASSIGNED',
            'TASK_COMMENT_ADDED',
            'TASK_REVIEW_REQUESTED',
            'TASK_ACCEPTED',
            'TASK_DECLINED',
            'TASK_RETURNED',
            'TASK_COMPLETED'
        ]
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