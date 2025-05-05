const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const User = require('../../users/models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const logger = require('../../../utils/logger');
const ApiError = require('../../../utils/ApiError');
const cloudinary = require('../../../config/cloudinary');
const fs = require('fs');

/**
 * @desc    Create a new chat
 * @route   POST /api/chats
 * @access  Private
 */
const createChat = asyncHandler(async (req, res) => {
    const { title, participants, isGroup } = req.body;
    const participantsArray = Array.isArray(participants) ? participants : JSON.parse(participants || '[]');

    if ((!participantsArray || participantsArray.length === 0) && !isGroup) {
        res.status(400);
        throw new Error('Chat must have at least one participant');
    }

    // Validate all participants exist
    const participantIds = [...participantsArray, req.user.id];
    const uniqueParticipantIds = [...new Set(participantIds)];

    const users = await User.find({ _id: { $in: uniqueParticipantIds } });

    if (users.length !== uniqueParticipantIds.length) {
        res.status(400);
        throw new Error('One or more participants do not exist');
    }

    // If it's a direct chat (not a group), check if a chat already exists between these users
    if (!isGroup && participantsArray.length === 1) {
        const existingChat = await Chat.findOne({
            isGroup: false,
            participants: {
                $all: uniqueParticipantIds,
                $size: uniqueParticipantIds.length
            }
        });

        if (existingChat) {
            return res.status(200).json(existingChat);
        }
    }

    // Handle group picture upload if provided
    let groupPicture = null;
    if (req.file && isGroup === 'true') {
        try {
            console.log('Uploading group picture to Cloudinary:', req.file.path);

            // Make sure uploads directory exists
            if (!fs.existsSync(req.file.path)) {
                console.error('File does not exist at path:', req.file.path);
                res.status(500);
                throw new Error('File upload failed - file not found');
            }

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'petroleum/chat_pictures',
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
                resource_type: 'image',
                overwrite: true
            });

            console.log('Cloudinary upload successful:', result);

            groupPicture = {
                url: result.secure_url,
                publicId: result.public_id
            };

            // Remove the local file after upload
            fs.unlinkSync(req.file.path);
            console.log('Successfully uploaded group picture and removed local file');
        } catch (error) {
            console.error('Error uploading group picture to Cloudinary:', error);
            logger.error('Error uploading group picture:', error);
            // Continue without the picture if upload fails
        }
    } else {
        console.log('No file uploaded or not a group chat:', {
            hasFile: !!req.file,
            isGroup: isGroup
        });
    }

    // Create new chat
    const chatData = {
        title: title || null,
        isGroup: isGroup === 'true',
        participants: uniqueParticipantIds,
        admin: req.user.id
    };

    if (groupPicture) {
        chatData.groupPicture = groupPicture;
    }

    const chat = await Chat.create(chatData);

    const populatedChat = await Chat.findById(chat._id)
        .populate('participants', 'name email profilePicture')
        .populate('admin', 'name email');

    // Notify all participants that they've been added to a chat
    const io = global.io;
    const userSockets = global.userSockets;

    if (io) {
        uniqueParticipantIds.forEach(userId => {
            if (userId.toString() !== req.user.id.toString()) {
                const socketId = userSockets.get(userId.toString());
                if (socketId) {
                    io.to(socketId).emit('notification', {
                        type: 'NEW_CHAT',
                        payload: {
                            chatId: chat._id,
                            message: isGroup === 'true'
                                ? `You were added to group chat "${title || 'New Group'}" by ${req.user.name}`
                                : `${req.user.name} started a conversation with you`
                        }
                    });
                }
            }
        });
    }

    res.status(201).json(populatedChat);
});

/**
 * @desc    Get all chats for current user
 * @route   GET /api/chats
 * @access  Private
 */
const getUserChats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Find all chats where user is a participant
    const chats = await Chat.find({ participants: userId })
        .populate('participants', 'name email profilePicture')
        .populate('admin', 'name email')
        .sort({ updatedAt: -1 });

    // Get last message and unread count for each chat
    const chatsWithMeta = await Promise.all(chats.map(async (chat) => {
        const lastMessage = await Message.findOne({ chat: chat._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name');

        const unreadCount = await Message.countDocuments({
            chat: chat._id,
            readBy: { $ne: userId },
            sender: { $ne: userId }
        });

        return {
            ...chat.toObject(),
            lastMessage: lastMessage || null,
            unreadCount
        };
    }));

    res.status(200).json(chatsWithMeta);
});

/**
 * @desc    Get chat by ID
 * @route   GET /api/chats/:chatId
 * @access  Private
 */
const getChatById = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;

    // Check if chat exists and user is a participant
    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    })
        .populate('participants', 'name email profilePicture')
        .populate('admin', 'name email');

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found or you do not have access');
    }

    // Get last message and unread count
    const lastMessage = await Message.findOne({ chat: chat._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name');

    const unreadCount = await Message.countDocuments({
        chat: chat._id,
        readBy: { $ne: userId },
        sender: { $ne: userId }
    });

    const chatWithMeta = {
        ...chat.toObject(),
        lastMessage: lastMessage || null,
        unreadCount
    };

    res.status(200).json(chatWithMeta);
});

/**
 * @desc    Update chat details
 * @route   PUT /api/chats/:chatId
 * @access  Private
 */
const updateChat = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const { title } = req.body;

    // Find chat and verify user is admin
    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found');
    }

    if (chat.admin.toString() !== userId) {
        res.status(403);
        throw new Error('Only chat admin can update chat details');
    }

    chat.title = title || chat.title;
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
        .populate('participants', 'name email profilePicture')
        .populate('admin', 'name email');

    res.status(200).json(updatedChat);
});

/**
 * @desc    Add participant to chat
 * @route   POST /api/chats/:chatId/participants
 * @access  Private
 */
const addParticipant = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId) {
        res.status(400);
        throw new Error('Participant ID is required');
    }

    // Find chat and verify user is admin
    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found');
    }

    if (chat.admin.toString() !== userId) {
        res.status(403);
        throw new Error('Only chat admin can add participants');
    }

    // Check if participant exists
    const user = await User.findById(participantId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if participant is already in the chat
    if (chat.participants.includes(participantId)) {
        res.status(400);
        throw new Error('User is already a participant in this chat');
    }

    // Add participant
    chat.participants.push(participantId);
    await chat.save();

    // Notify the added participant
    const io = global.io;
    const userSockets = global.userSockets;

    if (io) {
        const socketId = userSockets.get(participantId);
        if (socketId) {
            io.to(socketId).emit('notification', {
                type: 'ADDED_TO_CHAT',
                payload: {
                    chatId: chat._id,
                    message: `You were added to ${chat.isGroup ? 'group ' : ''}chat by ${req.user.name}`
                }
            });
        }
    }

    const updatedChat = await Chat.findById(chatId)
        .populate('participants', 'name email profilePicture')
        .populate('admin', 'name email');

    res.status(200).json(updatedChat);
});

/**
 * @desc    Remove participant from chat
 * @route   DELETE /api/chats/:chatId/participants/:userId
 * @access  Private
 */
const removeParticipant = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const currentUserId = req.user.id;
    const participantToRemoveId = req.params.userId;

    // Find chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404);
        throw new Error('Chat not found');
    }

    // Verify requester is admin or removing self
    const isSelfRemoval = currentUserId === participantToRemoveId;
    const isAdmin = chat.admin.toString() === currentUserId;

    if (!isAdmin && !isSelfRemoval) {
        res.status(403);
        throw new Error('Only chat admin can remove other participants');
    }

    // Check if participant is in the chat
    if (!chat.participants.includes(participantToRemoveId)) {
        res.status(400);
        throw new Error('User is not a participant in this chat');
    }

    // Remove participant
    chat.participants = chat.participants.filter(
        p => p.toString() !== participantToRemoveId
    );

    // If admin leaves, assign a new admin if other participants exist
    if (isSelfRemoval && isAdmin && chat.participants.length > 0) {
        chat.admin = chat.participants[0];
    }

    // If no participants left, delete the chat
    if (chat.participants.length === 0) {
        await Chat.findByIdAndDelete(chatId);
        await Message.deleteMany({ chat: chatId });
        return res.status(200).json({ message: 'Chat deleted as all participants have left' });
    }

    await chat.save();

    const updatedChat = await Chat.findById(chatId)
        .populate('participants', 'name email profilePicture')
        .populate('admin', 'name email');

    res.status(200).json(updatedChat);
});

module.exports = {
    createChat,
    getUserChats,
    getChatById,
    updateChat,
    addParticipant,
    removeParticipant
}; 