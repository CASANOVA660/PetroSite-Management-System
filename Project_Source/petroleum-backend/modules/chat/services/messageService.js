const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Create a new message
exports.createMessage = async (messageData) => {
    try {
        const { chatId, sender } = messageData;

        // Verify chat exists and user is a participant
        const chat = await Chat.findOne({
            _id: chatId,
            participants: sender
        });

        if (!chat) {
            throw new Error('Chat not found or user not a participant');
        }

        // Create message
        const newMessage = new Message(messageData);
        const savedMessage = await newMessage.save();

        // Update latest message in chat
        chat.latestMessage = savedMessage._id;
        chat.updatedAt = new Date();
        await chat.save();

        // Populate sender information
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'name email avatar');

        return populatedMessage;
    } catch (error) {
        throw new Error(`Error creating message: ${error.message}`);
    }
};

// Get messages for a chat
exports.getChatMessages = async (chatId, userId, limit = 50, page = 1) => {
    try {
        // Verify chat exists and user is a participant
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            throw new Error('Chat not found or user not a participant');
        }

        const skip = (page - 1) * limit;

        // Get messages with pagination
        const messages = await Message.find({ chatId })
            .populate('sender', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalMessages = await Message.countDocuments({ chatId });

        // Mark messages as read by this user
        await Message.updateMany(
            {
                chatId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            { $addToSet: { readBy: userId } }
        );

        return {
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                total: totalMessages,
                page,
                limit,
                pages: Math.ceil(totalMessages / limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching chat messages: ${error.message}`);
    }
};

// Get unread message count for a user
exports.getUnreadMessageCount = async (userId) => {
    try {
        // Get all chats where user is a participant
        const userChats = await Chat.find({ participants: userId }).select('_id');
        const chatIds = userChats.map(chat => chat._id);

        // Count messages not read by user in those chats
        const unreadCount = await Message.countDocuments({
            chatId: { $in: chatIds },
            sender: { $ne: userId },
            readBy: { $ne: userId }
        });

        return unreadCount;
    } catch (error) {
        throw new Error(`Error getting unread message count: ${error.message}`);
    }
};

// Get unread count by chat for a user
exports.getUnreadCountByChat = async (userId) => {
    try {
        // Get all chats where user is a participant
        const userChats = await Chat.find({ participants: userId }).select('_id');
        const chatIds = userChats.map(chat => chat._id);

        // Aggregate unread messages by chat
        const unreadByChat = await Message.aggregate([
            {
                $match: {
                    chatId: { $in: chatIds },
                    sender: { $ne: new ObjectId(userId) },
                    readBy: { $ne: new ObjectId(userId) }
                }
            },
            {
                $group: {
                    _id: '$chatId',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object for easier consumption
        const unreadCounts = {};
        unreadByChat.forEach(item => {
            unreadCounts[item._id.toString()] = item.count;
        });

        return unreadCounts;
    } catch (error) {
        throw new Error(`Error getting unread counts by chat: ${error.message}`);
    }
}; 