const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const managerAccessMiddleware = require('../middleware/managerAccess');
const ragController = require('../controllers/ragController');
const { uploadDocument } = require('../../../middleware/upload');

/**
 * RAG Chatbot Routes
 * All routes require authentication and manager role
 */

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(managerAccessMiddleware);

// Chat routes
router.post('/chat', ragController.createChat);
router.get('/chats', ragController.getUserChats);
router.get('/chats/:chatId', ragController.getChatById);
router.put('/chats/:chatId', ragController.updateChat);
router.delete('/chats/:chatId', ragController.deleteChat);

// Direct database query route - high priority route for direct database access
router.post('/query', ragController.directDatabaseQuery);

// Message routes - IMPORTANT: order matters for Express routing
// The more specific routes must come before the more general routes with params
// Add a route for direct database queries without requiring a specific chat
router.post('/chats/new/messages', ragController.sendMessageWithoutChat);

// Regular message routes with chatId parameter
router.post('/chats/:chatId/messages', ragController.sendMessage);
router.get('/chats/:chatId/messages', ragController.getChatMessages);

// Document routes
router.post('/documents', uploadDocument, ragController.uploadDocument);
router.get('/documents', ragController.getUserDocuments);
router.get('/documents/:documentId', ragController.getDocumentById);
router.delete('/documents/:documentId', ragController.deleteDocument);

// Code indexing route
router.post('/index-code', ragController.indexProjectCode);

// Streaming route
router.post('/chats/:chatId/stream', ragController.streamResponse);

module.exports = router; 