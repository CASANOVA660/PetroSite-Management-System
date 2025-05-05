const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const logger = require('../../../utils/logger');
const ApiError = require('../../../utils/ApiError');
const cloudinary = require('../../../config/cloudinary');
const fs = require('fs');
const path = require('path');

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

/**
 * @desc    Send a message with file attachment
 * @route   POST /api/chats/:chatId/messages/attachment
 * @access  Private
 */
const sendMessageWithAttachment = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const { content } = req.body;
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

    // Check if a file was uploaded
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    try {
        console.log('Processing file attachment:', req.file.originalname, 'for chat:', chatId);

        // Determine file type category based on mimetype
        let fileType = 'document'; // default
        if (req.file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
            fileType = 'video';
        } else if (req.file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
        }

        // Make sure the file exists
        if (!fs.existsSync(req.file.path)) {
            console.error('File does not exist at path:', req.file.path);
            res.status(500);
            throw new Error('File upload failed - file not found');
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'petroleum/chat_attachments',
            resource_type: 'auto', // Let Cloudinary detect the resource type
            public_id: path.parse(req.file.originalname).name + '_' + Date.now()
        });

        console.log('Cloudinary upload successful:', uploadResult);

        // Remove the temporary file after upload
        fs.unlinkSync(req.file.path);

        // Create the message with the attachment
        const messageData = {
            chat: chatId,
            sender: userId,
            readBy: [userId], // Mark as read by sender
            attachments: [{
                url: uploadResult.secure_url,
                type: fileType,
                filename: req.file.originalname,
                size: req.file.size
            }]
        };

        // Only add content if it's provided and not empty
        if (content && content.trim()) {
            messageData.content = content.trim();
        } else {
            messageData.content = ""; // Set empty string as default
        }

        const message = await Message.create(messageData);

        // Update chat's lastMessage
        chat.lastMessage = message._id;
        await chat.save();

        // Populate sender details for the response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email profilePicture');

        // Notify all participants using socket.io
        const io = global.io;
        if (io) {
            // Get all online participants except sender
            const onlineParticipants = chat.participants
                .filter(p => p.toString() !== userId && global.userSockets[p.toString()]);

            // Emit new message event to all online participants
            onlineParticipants.forEach(participantId => {
                const socketId = global.userSockets[participantId.toString()];
                if (socketId) {
                    console.log(`Emitting new message with attachment to user ${participantId}`);
                    io.to(socketId).emit('new_message', {
                        chatId,
                        message: populatedMessage
                    });
                }
            });
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error processing file attachment:', error);
        // If message was created but file processing failed, delete the message
        if (error.messageId) {
            await Message.findByIdAndDelete(error.messageId);
        }
        res.status(500);
        throw new Error(`Failed to process file attachment: ${error.message}`);
    }
});

module.exports = {
    sendMessage,
    getMessages,
    markChatAsRead,
    getUnreadCount,
    handleTyping,
    sendMessageWithAttachment
}; 