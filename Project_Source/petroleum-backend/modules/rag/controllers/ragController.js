const ragService = require('../services/ragService');
const documentService = require('../services/documentService');
const embeddingService = require('../services/embeddingService');
const Document = require('../models/Document');
const RagChat = require('../models/RagChat');
const codeIndexingService = require('../services/codeIndexingService');
const path = require('path');
const logger = require('../../../utils/logger');

/**
 * Create a new chat
 * @route POST /api/rag/chat
 */
const createChat = async (req, res) => {
    try {
        const { title, context, settings } = req.body;

        const chatData = {
            title: title || 'New Chat',
            user: req.user.id,
            context: context || undefined,
            settings: settings || undefined
        };

        const chat = await ragService.createChat(chatData);

        res.status(201).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du chat',
            error: error.message
        });
    }
};

/**
 * Get all user chats
 * @route GET /api/rag/chats
 */
const getUserChats = async (req, res) => {
    try {
        const chats = await ragService.getUserChats(req.user.id);

        res.status(200).json({
            success: true,
            data: chats
        });
    } catch (error) {
        console.error('Error getting user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des chats',
            error: error.message
        });
    }
};

/**
 * Get a chat by ID
 * @route GET /api/rag/chats/:chatId
 */
const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await ragService.getChatById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat non trouvé'
            });
        }

        // Check if user owns the chat
        if (chat.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce chat'
            });
        }

        res.status(200).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error(`Error getting chat ${req.params.chatId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du chat',
            error: error.message
        });
    }
};

/**
 * Update a chat
 * @route PUT /api/rag/chats/:chatId
 */
const updateChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { title, context, settings } = req.body;

        // Verify chat exists and belongs to user
        const chat = await RagChat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat non trouvé'
            });
        }

        if (chat.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce chat'
            });
        }

        // Update fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (context !== undefined) updateData.context = context;
        if (settings !== undefined) updateData.settings = settings;

        const updatedChat = await ragService.updateChat(chatId, updateData);

        res.status(200).json({
            success: true,
            data: updatedChat
        });
    } catch (error) {
        console.error(`Error updating chat ${req.params.chatId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du chat',
            error: error.message
        });
    }
};

/**
 * Delete a chat
 * @route DELETE /api/rag/chats/:chatId
 */
const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Verify chat exists and belongs to user
        const chat = await RagChat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat non trouvé'
            });
        }

        if (chat.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce chat'
            });
        }

        // Soft delete
        const deletedChat = await ragService.deleteChat(chatId);

        res.status(200).json({
            success: true,
            data: deletedChat
        });
    } catch (error) {
        console.error(`Error deleting chat ${req.params.chatId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du chat',
            error: error.message
        });
    }
};

/**
 * Send a message to a chat
 * @route POST /api/rag/chats/:chatId/messages
 */
const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message est requis'
            });
        }

        // Verify chat exists and belongs to user
        const chat = await RagChat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat non trouvé'
            });
        }

        if (chat.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce chat'
            });
        }

        // Create user message
        const userMessage = await ragService.createMessage({
            chat: chatId,
            content,
            role: 'user'
        });

        // Process message with our free model
        const response = await ragService.processMessage(content, chatId);

        // Create assistant message
        const assistantMessage = await ragService.createMessage({
            chat: chatId,
            content: response.content,
            role: 'assistant',
            sources: response.sources || []
        });

        // Return both messages as an array
        const messagesArray = [userMessage, assistantMessage];

        res.status(200).json({
            success: true,
            data: messagesArray
        });
    } catch (error) {
        console.error(`Error sending message to chat ${req.params.chatId}:`, error);

        // Create error message if there was an issue
        try {
            await ragService.createMessage({
                chat: req.params.chatId,
                content: "Je suis désolé, une erreur s'est produite lors du traitement de votre message. Veuillez réessayer plus tard.",
                role: 'assistant',
                error: {
                    code: error.code || 'PROCESSING_ERROR',
                    message: error.message
                }
            });
        } catch (messageError) {
            console.error('Error creating error message:', messageError);
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
};

/**
 * Stream a response for a message
 * @route POST /api/rag/chats/:chatId/stream
 */
const streamResponse = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message est requis'
            });
        }

        // Verify chat exists and belongs to user
        const chat = await RagChat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat non trouvé'
            });
        }

        if (chat.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce chat'
            });
        }

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Get streaming response
        const { stream, messageId } = await ragService.streamResponse(chatId, content);

        let completeResponse = '';

        // Send stream events to client
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            completeResponse += content;

            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        // Update the message with complete content
        await ragService.updateStreamedMessage(messageId, completeResponse);

        // Send done event
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error) {
        console.error(`Error streaming response for chat ${req.params.chatId}:`, error);

        // If headers are not sent yet, send error response
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du streaming de la réponse',
                error: error.message
            });
        }

        // If headers are already sent, send error in SSE format
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};

/**
 * Get all messages for a chat
 * @route GET /api/rag/chats/:chatId/messages
 */
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Verify chat exists and belongs to user
        const chat = await RagChat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat non trouvé'
            });
        }

        if (chat.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce chat'
            });
        }

        const messages = await ragService.getChatMessages(chatId);

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error(`Error getting messages for chat ${req.params.chatId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
};

/**
 * Upload a document
 * @route POST /api/rag/documents
 */
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier n\'a été téléchargé'
            });
        }

        const { title, description, source } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Le titre du document est requis'
            });
        }

        // Determine file type from mime type or extension
        let fileType = 'other';
        const mimeType = req.file.mimetype;
        const fileName = req.file.originalname;

        if (mimeType.includes('pdf')) {
            fileType = 'pdf';
        } else if (mimeType.includes('text/plain') || fileName.endsWith('.txt')) {
            fileType = 'txt';
        } else if (mimeType.includes('html')) {
            fileType = 'html';
        } else if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            fileType = 'docx';
        }

        // Create document record
        const document = await Document.create({
            title,
            description: description || title,
            fileType,
            source: source || 'Upload',
            uploadedBy: req.user.id,
            file: {
                url: req.file.path,
                publicId: req.file.filename,
                size: req.file.size
            },
            processingStatus: 'pending'
        });

        // Process document asynchronously
        // In a production system, this would be handled by a queue
        setTimeout(async () => {
            try {
                await documentService.processDocument(document);
                await embeddingService.processDocumentChunks(document._id);
            } catch (error) {
                console.error(`Error processing document ${document._id}:`, error);
            }
        }, 0);

        res.status(201).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement du document',
            error: error.message
        });
    }
};

/**
 * Get all documents for a user
 * @route GET /api/rag/documents
 */
const getUserDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ uploadedBy: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        console.error('Error getting user documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des documents',
            error: error.message
        });
    }
};

/**
 * Get a document by ID
 * @route GET /api/rag/documents/:documentId
 */
const getDocumentById = async (req, res) => {
    try {
        const { documentId } = req.params;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        // Check if user owns the document
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce document'
            });
        }

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error(`Error getting document ${req.params.documentId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du document',
            error: error.message
        });
    }
};

/**
 * Delete a document
 * @route DELETE /api/rag/documents/:documentId
 */
const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        // Check if user owns the document
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce document'
            });
        }

        // Delete document vectors from vector database
        await embeddingService.deleteDocumentVectors(documentId);

        // Delete document
        await Document.findByIdAndDelete(documentId);

        res.status(200).json({
            success: true,
            message: 'Document supprimé avec succès'
        });
    } catch (error) {
        console.error(`Error deleting document ${req.params.documentId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du document',
            error: error.message
        });
    }
};

/**
 * Index project code for RAG
 * @route POST /api/rag/index-code
 */
const indexProjectCode = async (req, res) => {
    try {
        // Get project root path - default to the application root
        const projectRoot = req.body.projectRoot || path.resolve(process.cwd(), '../..');

        // Start the indexing process
        const stats = await codeIndexingService.indexProjectCode(projectRoot);

        res.status(200).json({
            success: true,
            message: 'Project code indexing completed successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error indexing project code:', error);
        res.status(500).json({
            success: false,
            message: 'Error indexing project code',
            error: error.message
        });
    }
};

/**
 * Send a message without specifying a chat (creates a temporary one if needed)
 * @route POST /api/rag/chats/new/messages
 */
const sendMessageWithoutChat = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message est requis'
            });
        }

        // Find or create a temporary chat for the user
        let chat = await RagChat.findOne({
            user: req.user.id,
            title: 'Temporary Chat',
            context: 'Direct database queries'
        });

        if (!chat) {
            chat = await ragService.createChat({
                title: 'Temporary Chat',
                user: req.user.id,
                context: 'Direct database queries'
            });
        }

        // Create user message
        const userMessage = await ragService.createMessage({
            chat: chat._id,
            content,
            role: 'user'
        });

        // Process message with our database query service or free model
        const response = await ragService.processMessage(content, chat._id);

        // Create assistant message
        const assistantMessage = await ragService.createMessage({
            chat: chat._id,
            content: response.content,
            role: 'assistant',
            sources: response.sources || []
        });

        // Return both messages as an array
        const messagesArray = [userMessage, assistantMessage];

        res.status(200).json({
            success: true,
            data: messagesArray
        });
    } catch (error) {
        console.error(`Error sending message to temporary chat:`, error);

        // Return a meaningful error message
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
};

/**
 * Direct database query endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const directDatabaseQuery = async (req, res) => {
    const startTime = Date.now();
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        logger.info(`Processing direct database query: "${content}" from user ${req.user.id}`);

        // Check if this is a project/database info query
        if (ragService.isProjectInfoQuery(content)) {
            // Handle with the database query service
            const response = await ragService.handleProjectInfoQuery(content, req.user.id);

            // Create a response with just the database response
            return res.status(200).json({
                success: true,
                message: {
                    content: response,
                    sources: [],
                    role: 'assistant',
                    metadata: {
                        source: 'database',
                        queryTime: Date.now() - startTime,
                        timestamp: new Date()
                    }
                }
            });
        } else {
            // Not a database query, fall back to the RAG system
            return res.status(200).json({
                success: false,
                error: "This doesn't appear to be a database query. Please try using the regular RAG mode or rephrase your query to ask about projects, tasks, users, or documents."
            });
        }
    } catch (error) {
        logger.error(`Error in directDatabaseQuery: ${error.message}`);
        if (error.timeout) {
            return res.status(408).json({ error: 'Query timed out. Please try again.' });
        }
        return res.status(500).json({ error: `Failed to process database query: ${error.message}` });
    }
};

module.exports = {
    createChat,
    getUserChats,
    getChatById,
    updateChat,
    deleteChat,
    sendMessage,
    getChatMessages,
    streamResponse,
    uploadDocument,
    getUserDocuments,
    getDocumentById,
    deleteDocument,
    indexProjectCode,
    sendMessageWithoutChat,
    directDatabaseQuery
}; 