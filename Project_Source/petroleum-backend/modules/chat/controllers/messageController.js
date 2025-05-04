const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const logger = require('../../../utils/logger');
const ApiError = require('../../../utils/ApiError');

/**
 * @desc    Send a new message
 * @route   POST /api/chats/:chatId/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        res.status(400);
        throw new Error('Message content is required');
    }

    // Check if chat exists and user is a participant
    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    });

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found or you are not a participant');
    }

    // Create and save message
    const message = await Message.create({
        chat: chatId,
        sender: userId,
        content,
        readBy: [userId] // Mark as read by sender
    });

    // Update chat's lastMessage and updatedAt
    chat.lastMessage = message._id;
    await chat.save();

    // Populate sender details for the response
    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email profilePicture');

    // Notify all participants
    const io = global.io;
    const userSockets = global.userSockets;

    if (io) {
        chat.participants.forEach(participantId => {
            if (participantId.toString() !== userId) {
                const socketId = userSockets.get(participantId.toString());
                if (socketId) {
                    io.to(socketId).emit('message', {
                        type: 'NEW_MESSAGE',
                        payload: {
                            message: populatedMessage,
                            chatId
                        }
                    });
                }
            }
        });
    }

    res.status(201).json(populatedMessage);
});

/**
 * @desc    Get messages for a chat
 * @route   GET /api/chats/:chatId/messages
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if chat exists and user is a participant
    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    });

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found or you are not a participant');
    }

    // Get messages with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'name email profilePicture');

    // Count total messages for pagination
    const totalMessages = await Message.countDocuments({ chat: chatId });

    res.status(200).json({
        messages: messages.reverse(), // Return in chronological order
        pagination: {
            total: totalMessages,
            page: parseInt(page),
            pages: Math.ceil(totalMessages / parseInt(limit))
        }
    });
});

/**
 * @desc    Mark all messages in a chat as read
 * @route   PUT /api/chats/:chatId/read
 * @access  Private
 */
const markChatAsRead = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;

    // Check if chat exists and user is a participant
    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    });

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found or you are not a participant');
    }

    // Find all unread messages by current user in this chat
    const result = await Message.updateMany(
        {
            chat: chatId,
            readBy: { $ne: userId },
            sender: { $ne: userId }
        },
        {
            $addToSet: { readBy: userId }
        }
    );

    res.status(200).json({
        success: true,
        count: result.nModified || 0,
        message: `Marked ${result.nModified || 0} messages as read`
    });
});

/**
 * @desc    Get count of unread messages for the user
 * @route   GET /api/chats/messages/unread
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get all chats where user is a participant
    const chats = await Chat.find({ participants: userId });
    const chatIds = chats.map(chat => chat._id);

    // Count unread messages by chat
    const unreadByChat = await Message.aggregate([
        {
            $match: {
                chat: { $in: chatIds },
                readBy: { $ne: mongoose.Types.ObjectId(userId) },
                sender: { $ne: mongoose.Types.ObjectId(userId) }
            }
        },
        {
            $group: {
                _id: '$chat',
                count: { $sum: 1 }
            }
        }
    ]);

    // Format results
    const unreadCounts = unreadByChat.reduce((result, item) => {
        result[item._id] = item.count;
        return result;
    }, {});

    // Get total unread count
    const totalUnread = unreadByChat.reduce((total, item) => total + item.count, 0);

    res.status(200).json({
        totalUnread,
        unreadByChat: unreadCounts
    });
});

/**
 * Handle typing events
 * This isn't a route but a socket.io event handler
 */
const handleTyping = (socket, io, userSockets) => {
    // When a user starts typing
    socket.on('typing', (data) => {
        const { chatId, userId } = data;

        // Find the chat to get participants
        Chat.findById(chatId)
            .then(chat => {
                if (!chat) {
                    return;
                }

                // Notify all participants except the user who is typing
                chat.participants.forEach(participantId => {
                    if (participantId.toString() !== userId) {
                        const socketId = userSockets.get(participantId.toString());
                        if (socketId) {
                            io.to(socketId).emit('typing', {
                                chatId,
                                userId
                            });
                        }
                    }
                });
            })
            .catch(err => {
                logger.error('Error in typing event handler:', err);
            });
    });

    // When a user stops typing
    socket.on('stop-typing', (data) => {
        const { chatId, userId } = data;

        // Find the chat to get participants
        Chat.findById(chatId)
            .then(chat => {
                if (!chat) {
                    return;
                }

                // Notify all participants except the user who stopped typing
                chat.participants.forEach(participantId => {
                    if (participantId.toString() !== userId) {
                        const socketId = userSockets.get(participantId.toString());
                        if (socketId) {
                            io.to(socketId).emit('stop-typing', {
                                chatId,
                                userId
                            });
                        }
                    }
                });
            })
            .catch(err => {
                logger.error('Error in stop-typing event handler:', err);
            });
    });
};

module.exports = {
    sendMessage,
    getMessages,
    markChatAsRead,
    getUnreadCount,
    handleTyping
}; 