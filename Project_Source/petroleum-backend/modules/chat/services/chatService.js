const Chat = require('../models/Chat');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Create a new chat group
exports.createChat = async (chatData) => {
    try {
        const newChat = new Chat({
            ...chatData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedChat = await newChat.save();

        // Populate participants data
        const populatedChat = await Chat.findById(savedChat._id)
            .populate('participants', 'name email avatar')
            .populate('admins', 'name email avatar')
            .populate('createdBy', 'name email avatar');

        return populatedChat;
    } catch (error) {
        throw new Error(`Error creating chat: ${error.message}`);
    }
};

// Get chats for a user
exports.getUserChats = async (userId) => {
    try {
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name email avatar')
            .populate('admins', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });

        return chats;
    } catch (error) {
        throw new Error(`Error fetching user chats: ${error.message}`);
    }
};

// Get a chat by ID
exports.getChatById = async (chatId, userId) => {
    try {
        // Ensure the user is a participant
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        })
            .populate('participants', 'name email avatar')
            .populate('admins', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate({
                path: 'latestMessage',
                populate: {
                    path: 'sender',
                    select: 'name email avatar'
                }
            });

        if (!chat) {
            throw new Error('Chat not found or user not a participant');
        }

        return chat;
    } catch (error) {
        throw new Error(`Error fetching chat: ${error.message}`);
    }
};

// Add a participant to a chat
exports.addParticipant = async (chatId, userId, currentUserId) => {
    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            throw new Error('Chat not found');
        }

        // Check if current user is admin
        const isAdmin = chat.admins.some(admin => admin.toString() === currentUserId.toString());

        if (!isAdmin) {
            throw new Error('Only admins can add participants');
        }

        // Check if user is already a participant
        if (chat.participants.includes(userId)) {
            throw new Error('User is already a participant');
        }

        chat.participants.push(userId);
        await chat.save();

        return await Chat.findById(chatId)
            .populate('participants', 'name email avatar')
            .populate('admins', 'name email avatar');
    } catch (error) {
        throw new Error(`Error adding participant: ${error.message}`);
    }
};

// Remove a participant from a chat
exports.removeParticipant = async (chatId, userId, currentUserId) => {
    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            throw new Error('Chat not found');
        }

        // Check if current user is admin
        const isAdmin = chat.admins.some(admin => admin.toString() === currentUserId.toString());

        if (!isAdmin && userId !== currentUserId) {
            throw new Error('Only admins can remove other participants');
        }

        chat.participants = chat.participants.filter(
            participant => participant.toString() !== userId.toString()
        );

        // If user is also an admin, remove from admins array
        chat.admins = chat.admins.filter(
            admin => admin.toString() !== userId.toString()
        );

        await chat.save();

        return await Chat.findById(chatId)
            .populate('participants', 'name email avatar')
            .populate('admins', 'name email avatar');
    } catch (error) {
        throw new Error(`Error removing participant: ${error.message}`);
    }
};