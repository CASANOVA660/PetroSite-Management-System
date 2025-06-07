const { OpenAI } = require('openai');
const RagChat = require('../models/RagChat');
const RagMessage = require('../models/RagMessage');
const Document = require('../models/Document');
const embeddingService = require('./embeddingService');
const axios = require('axios');
const { makeChain } = require('./chainService');
const { retrieveRelevantDocuments } = require('./retrievalService');
const databaseQueryService = require('./databaseQueryService');
const logger = require('../../../utils/logger');

// Get environment variables for Ollama configuration
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

// Remove OpenAI initialization
logger.info('Using Ollama for all requests');

// Update the array of keywords for project-related queries
const projectKeywords = [
    // Existing project keywords
    'project', 'projects', 'status', 'open', 'in progress', 'closed', 'completed', 'active users', 'online users', 'logged in', 'recently active',
    'current users', 'which users', 'who are',

    // Project queries
    'how many projects', 'project statistics', 'project count', 'projects by status', 'recent projects',
    'top project creators', 'projects with most tasks', 'multiple projects', 'project completion',
    'list all projects', 'list projects', 'show all projects', 'show projects', 'get all projects',

    // Task queries
    'tasks', 'task', 'priority', 'high priority', 'medium priority', 'low priority', 'upcoming deadlines',
    'overdue tasks', 'task statistics', 'completed tasks', 'assigned to me', 'my tasks', 'task count',
    'users with most tasks', 'recently completed', 'task completion rate',

    // User queries
    'user', 'users', 'active', 'inactive', 'role', 'roles', 'user statistics', 'user count',
    'role statistics', 'recently registered', 'top users',

    // Document queries
    'document', 'documents', 'file', 'files', 'document statistics', 'document count',
    'document types', 'top uploaders', 'recent uploads', 'processing status'
];

// Function to determine if a message is asking for project/database information
const isProjectInfoQuery = (message) => {
    // Check if any of the keywords are in the message
    return projectKeywords.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
    );
};

// Function to extract query parameters from the message
const extractQueryParams = (message) => {
    // Extract project ID if present
    const projectIdMatch = message.match(/project (?:id|ID|number|#):?\s*([A-Za-z0-9-]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;

    // Extract user ID if present
    const userIdMatch = message.match(/user (?:id|ID):?\s*([A-Za-z0-9-]+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    // Extract task status if present
    const statusMatch = message.match(/status:?\s*([A-Za-z]+)/);
    const status = statusMatch ? statusMatch[1] : null;

    // Extract role if present
    const roleMatch = message.match(/role:?\s*([A-Za-z\s.]+)/);
    const role = roleMatch ? roleMatch[1].trim() : null;

    return { projectId, userId, status, role };
};

/**
 * Handle project info query
 * @param {string} message - User message
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Response
 */
async function handleProjectInfoQuery(message, userId) {
    try {
        // Convert to lowercase for easier matching
        const lowerMessage = message.toLowerCase();

        // USER-RELATED QUERIES - More robust detection of user queries
        if ((lowerMessage.includes('user') || lowerMessage.includes('which user') || lowerMessage.includes('who')) &&
            (lowerMessage.includes('active') || lowerMessage.includes('current') || lowerMessage.includes('online') ||
                lowerMessage.includes('logged in') || lowerMessage.includes('recently'))) {

            // Check if there's a specific time period mentioned
            let days = 30; // Default to 30 days
            const daysMatch = lowerMessage.match(/(\d+)\s*days?/);
            if (daysMatch && daysMatch[1]) {
                days = parseInt(daysMatch[1]);
            }

            const users = await databaseQueryService.getActiveUsers(days);

            if (!users || users.length === 0) {
                return `No users found in the system.`;
            }

            const activeUsers = users.filter(user => user.estActif === true);
            const inactiveUsers = users.filter(user => user.estActif !== true);

            let response = `Found ${users.length} users in the system.\n\n`;

            if (activeUsers.length > 0) {
                response += `Active Users (${activeUsers.length}):\n`;
                activeUsers.forEach(user => {
                    let lastLoginInfo = 'Never logged in';

                    if (user.lastLogin) {
                        const loginDate = new Date(user.lastLogin);
                        // Check if it's a valid date (not epoch 0)
                        if (loginDate > new Date(0)) {
                            lastLoginInfo = `Last login: ${loginDate.toLocaleDateString()} ${loginDate.toLocaleTimeString()}`;
                        } else if (user.updatedAt) {
                            // Fall back to updatedAt
                            const updateDate = new Date(user.updatedAt);
                            lastLoginInfo = `Last activity: ${updateDate.toLocaleDateString()} ${updateDate.toLocaleTimeString()}`;
                        }
                    } else if (user.updatedAt) {
                        // Fall back to updatedAt
                        const updateDate = new Date(user.updatedAt);
                        lastLoginInfo = `Last activity: ${updateDate.toLocaleDateString()} ${updateDate.toLocaleTimeString()}`;
                    }

                    response += `- ${user.prenom || ''} ${user.nom || ''} (${user.email}) - ${lastLoginInfo}\n`;
                });
                response += '\n';
            }

            if (inactiveUsers.length > 0) {
                response += `Inactive Users (${inactiveUsers.length}):\n`;
                inactiveUsers.forEach(user => {
                    let lastLoginInfo = 'Never logged in';

                    if (user.lastLogin) {
                        const loginDate = new Date(user.lastLogin);
                        // Check if it's a valid date (not epoch 0)
                        if (loginDate > new Date(0)) {
                            lastLoginInfo = `Last login: ${loginDate.toLocaleDateString()} ${loginDate.toLocaleTimeString()}`;
                        } else if (user.updatedAt) {
                            // Fall back to updatedAt
                            const updateDate = new Date(user.updatedAt);
                            lastLoginInfo = `Last activity: ${updateDate.toLocaleDateString()} ${updateDate.toLocaleTimeString()}`;
                        }
                    } else if (user.updatedAt) {
                        // Fall back to updatedAt
                        const updateDate = new Date(user.updatedAt);
                        lastLoginInfo = `Last activity: ${updateDate.toLocaleDateString()} ${updateDate.toLocaleTimeString()}`;
                    }

                    response += `- ${user.prenom || ''} ${user.nom || ''} (${user.email}) - ${lastLoginInfo}\n`;
                });
            }

            return response;
        }

        // LIST ALL PROJECTS QUERY
        else if (lowerMessage.includes('list all project') ||
            lowerMessage.includes('show all project') ||
            lowerMessage.includes('get all project')) {

            let limit = 10; // Default limit
            const limitMatch = lowerMessage.match(/(\d+)\s*projects?/);
            if (limitMatch && limitMatch[1]) {
                limit = parseInt(limitMatch[1]);
            }

            const options = { limit };
            const projects = await databaseQueryService.getAllProjects(options);

            if (!projects || projects.length === 0) {
                return 'No projects found in the system.';
            }

            let response = `All Projects (${projects.length}):\n\n`;

            projects.forEach((project, index) => {
                const createdDate = project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString()
                    : 'Unknown date';

                const creator = project.createdBy
                    ? `${project.createdBy.prenom} ${project.createdBy.nom}`
                    : 'Unknown';

                response += `${index + 1}. ${project.name || project.projectName} (${project.projectNumber})\n`;
                response += `   Status: ${project.status}, Created: ${createdDate} by ${creator}\n\n`;
            });

            return response;
        }

        // PROJECT COUNT QUERIES
        else if (lowerMessage.includes('how many project') ||
            lowerMessage.includes('project count') ||
            lowerMessage.includes('project statistics') ||
            lowerMessage.includes('projects by status')) {

            const projectCounts = await databaseQueryService.getProjectCountsByStatus();

            let response = 'Project Statistics:\n\n';

            for (const [status, count] of Object.entries(projectCounts)) {
                if (status !== 'total') {
                    response += `${status}: ${count} projects\n`;
                }
            }

            response += `\nTotal Projects: ${projectCounts.total}`;
            return response;
        }

        // RECENT PROJECTS QUERIES
        else if (lowerMessage.includes('recent project')) {
            // Check if there's a specific time period mentioned
            let days = 30; // Default to 30 days
            const daysMatch = lowerMessage.match(/(\d+)\s*days?/);
            if (daysMatch && daysMatch[1]) {
                days = parseInt(daysMatch[1]);
            }

            const recentProjects = await databaseQueryService.getRecentProjects(days);

            if (!recentProjects || recentProjects.length === 0) {
                return `No projects created in the last ${days} days.`;
            }

            let response = `Projects created in the last ${days} days (${recentProjects.length}):\n\n`;

            recentProjects.forEach(project => {
                const createdDate = new Date(project.createdAt).toLocaleDateString();
                const creator = project.createdBy
                    ? `${project.createdBy.prenom} ${project.createdBy.nom}`
                    : 'Unknown';

                response += `- ${project.name} (${project.projectNumber})\n`;
                response += `  Status: ${project.status}, Created: ${createdDate} by ${creator}\n\n`;
            });

            return response;
        }

        // TOP PROJECT CREATORS
        else if (lowerMessage.includes('top project creator')) {
            let limit = 5; // Default
            const limitMatch = lowerMessage.match(/top\s*(\d+)/);
            if (limitMatch && limitMatch[1]) {
                limit = parseInt(limitMatch[1]);
            }

            const topCreators = await databaseQueryService.getTopProjectCreators(limit);

            if (!topCreators || topCreators.length === 0) {
                return 'No project creators found.';
            }

            let response = `Top ${topCreators.length} Project Creators:\n\n`;

            topCreators.forEach((item, index) => {
                response += `${index + 1}. ${item.user.prenom} ${item.user.nom} (${item.user.role}): ${item.projectCount} projects\n`;
            });

            return response;
        }

        // PROJECTS WITH MOST TASKS
        else if (lowerMessage.includes('projects with most task')) {
            let limit = 5; // Default
            const limitMatch = lowerMessage.match(/top\s*(\d+)/);
            if (limitMatch && limitMatch[1]) {
                limit = parseInt(limitMatch[1]);
            }

            const projectsWithTasks = await databaseQueryService.getProjectsWithMostTasks(limit);

            if (!projectsWithTasks || projectsWithTasks.length === 0) {
                return 'No projects with tasks found.';
            }

            let response = `Projects with Most Tasks:\n\n`;

            projectsWithTasks.forEach((item, index) => {
                const creator = item.project.createdBy
                    ? `${item.project.createdBy.prenom} ${item.project.createdBy.nom}`
                    : 'Unknown';

                response += `${index + 1}. ${item.project.name} (${item.project.projectNumber}): ${item.taskCount} tasks\n`;
                response += `   Status: ${item.project.status}, Created by: ${creator}\n\n`;
            });

            return response;
        }

        // TASK PRIORITY QUERIES
        else if (lowerMessage.includes('task') && lowerMessage.includes('priority')) {
            const tasksByPriority = await databaseQueryService.getTasksByPriority();

            if (!tasksByPriority) {
                return 'No tasks found.';
            }

            let response = 'Tasks by Priority:\n\n';

            for (const [priority, tasks] of Object.entries(tasksByPriority)) {
                response += `${priority.toUpperCase()} Priority (${tasks.length} tasks):\n`;

                if (tasks.length === 0) {
                    response += '  No tasks with this priority\n\n';
                    continue;
                }

                // Show top 5 tasks for each priority
                const topTasks = tasks.slice(0, 5);
                topTasks.forEach(task => {
                    const assignee = task.assignee
                        ? `${task.assignee.prenom} ${task.assignee.nom}`
                        : 'Unassigned';

                    response += `- ${task.title} (Status: ${task.status})\n`;
                    response += `  Assigned to: ${assignee}\n`;
                });

                if (tasks.length > 5) {
                    response += `  ... and ${tasks.length - 5} more\n`;
                }

                response += '\n';
            }

            return response;
        }

        // UPCOMING DEADLINES
        else if (lowerMessage.includes('upcoming deadline')) {
            let days = 7; // Default to 7 days
            const daysMatch = lowerMessage.match(/(\d+)\s*days?/);
            if (daysMatch && daysMatch[1]) {
                days = parseInt(daysMatch[1]);
            }

            const upcomingTasks = await databaseQueryService.getTasksWithUpcomingDeadlines(days);

            if (!upcomingTasks || upcomingTasks.length === 0) {
                return `No tasks with deadlines in the next ${days} days.`;
            }

            let response = `Tasks with deadlines in the next ${days} days (${upcomingTasks.length}):\n\n`;

            upcomingTasks.forEach(task => {
                const deadline = new Date(task.endDate).toLocaleDateString();
                const assignee = task.assignee
                    ? `${task.assignee.prenom} ${task.assignee.nom}`
                    : 'Unassigned';

                response += `- ${task.title} (${task.status})\n`;
                response += `  Deadline: ${deadline}, Assigned to: ${assignee}\n\n`;
            });

            return response;
        }

        // MY TASKS QUERY
        else if (lowerMessage.includes('my task') || lowerMessage.includes('assigned to me')) {
            const userTasks = await databaseQueryService.getUserTasks(userId);

            if (!userTasks || userTasks.length === 0) {
                return 'You don\'t have any assigned tasks.';
            }

            let response = `Your Tasks (${userTasks.length}):\n\n`;

            // Group tasks by status
            const tasksByStatus = {};
            userTasks.forEach(task => {
                if (!tasksByStatus[task.status]) {
                    tasksByStatus[task.status] = [];
                }
                tasksByStatus[task.status].push(task);
            });

            for (const [status, tasks] of Object.entries(tasksByStatus)) {
                response += `${status.toUpperCase()} (${tasks.length}):\n`;

                tasks.forEach(task => {
                    const deadline = task.endDate
                        ? new Date(task.endDate).toLocaleDateString()
                        : 'No deadline';

                    response += `- ${task.title}\n`;
                    response += `  Priority: ${task.priority}, Deadline: ${deadline}\n`;

                    if (task.projectId) {
                        response += `  Project: ${task.projectId.name}\n`;
                    }

                    response += '\n';
                });
            }

            return response;
        }

        // OVERDUE TASKS
        else if (lowerMessage.includes('overdue task')) {
            const overdueTasks = await databaseQueryService.getOverdueTasks();

            if (!overdueTasks || overdueTasks.length === 0) {
                return 'No overdue tasks found.';
            }

            let response = `Overdue Tasks (${overdueTasks.length}):\n\n`;

            overdueTasks.forEach(task => {
                const deadline = new Date(task.endDate).toLocaleDateString();
                const assignee = task.assignee
                    ? `${task.assignee.prenom} ${task.assignee.nom}`
                    : 'Unassigned';

                response += `- ${task.title} (${task.status})\n`;
                response += `  Deadline: ${deadline}, Assigned to: ${assignee}\n`;

                if (task.projectId) {
                    response += `  Project: ${task.projectId.name}\n`;
                }

                response += '\n';
            });

            return response;
        }

        // USER ROLE STATISTICS
        else if (lowerMessage.includes('user role') || lowerMessage.includes('role statistic')) {
            const roleStats = await databaseQueryService.getUserRoleStats();

            if (!roleStats) {
                return 'No user role statistics available.';
            }

            let response = 'User Role Statistics:\n\n';

            for (const [role, count] of Object.entries(roleStats)) {
                if (role !== 'total') {
                    response += `${role}: ${count} users\n`;
                }
            }

            response += `\nTotal Users: ${roleStats.total}`;
            return response;
        }

        // DOCUMENT STATISTICS
        else if (lowerMessage.includes('document statistic') || lowerMessage.includes('document count')) {
            const docStats = await databaseQueryService.getDocumentStats();

            if (!docStats) {
                return 'No document statistics available.';
            }

            let response = 'Document Statistics:\n\n';

            response += `Total Documents: ${docStats.totalCount}\n\n`;

            response += 'By File Type:\n';
            for (const [type, count] of Object.entries(docStats.byFileType)) {
                response += `- ${type || 'Unknown'}: ${count} documents\n`;
            }

            response += '\nBy Processing Status:\n';
            for (const [status, count] of Object.entries(docStats.byProcessingStatus)) {
                response += `- ${status || 'Unknown'}: ${count} documents\n`;
            }

            response += '\nRecent Uploads:\n';
            docStats.recentUploads.forEach(doc => {
                const uploadDate = new Date(doc.createdAt).toLocaleDateString();
                response += `- ${doc.title} (${doc.fileType})\n`;
                response += `  Uploaded by: ${doc.uploadedBy}, Date: ${uploadDate}\n`;
            });

            return response;
        }

        // PROJECT COMPLETION RATE
        else if (lowerMessage.includes('completion rate') || lowerMessage.includes('task completion')) {
            const completionRates = await databaseQueryService.getTaskCompletionRateByProject();

            if (!completionRates || completionRates.length === 0) {
                return 'No project completion rates available.';
            }

            let response = 'Project Task Completion Rates:\n\n';

            completionRates.forEach((item, index) => {
                response += `${index + 1}. ${item.project.name} (${item.project.projectNumber})\n`;
                response += `   Status: ${item.project.status}\n`;
                response += `   Tasks: ${item.taskStats.completed}/${item.taskStats.total} completed (${item.taskStats.completionRate}%)\n\n`;
            });

            return response;
        }

        // PROJECT STATUS QUERY (original functionality)
        else if (lowerMessage.includes('project') && (
            lowerMessage.includes('status') ||
            lowerMessage.includes('en cours') ||
            lowerMessage.includes('clôturé') ||
            lowerMessage.includes('annulé'))) {
            // Extract status from the message
            let status = extractProjectStatus(lowerMessage);

            if (!status) {
                return 'Please specify a valid project status (En cours, Clôturé, Annulé).';
            }

            const projects = await databaseQueryService.getProjectsByStatus(status);

            if (!projects || projects.length === 0) {
                return `No projects with status "${status}" found.`;
            }

            let response = `Projects with status "${status}" (${projects.length}):\n\n`;

            projects.forEach(project => {
                response += `- ${project.name} (${project.projectNumber})\n`;
                if (project.createdBy) {
                    response += `  Created by: ${project.createdBy.prenom} ${project.createdBy.nom}\n`;
                }
                if (project.client) {
                    response += `  Client: ${project.client}\n`;
                }
                if (project.createdAt) {
                    response += `  Created on: ${new Date(project.createdAt).toLocaleDateString()}\n`;
                }
                response += '\n';
            });

            return response;
        }

        // Fallback to general project info
        const projects = await databaseQueryService.searchProjects('');
        return `Found ${projects.length} projects in the system. Please ask about a specific project status or use more specific queries.`;

    } catch (error) {
        logger.error(`Error in handleProjectInfoQuery: ${error.message}`);
        return "Sorry, I couldn't process your query about projects. Please try again.";
    }
}

/**
 * Call the Ollama API to generate a response
 * @param {string} prompt - The prompt to send to Ollama
 * @param {object} context - The context documents for RAG
 * @returns {Promise<string>} - The formatted response from Ollama
 */
const callOllamaAPI = async (prompt, context) => {
    try {
        // Create a system prompt that includes the context
        let systemPrompt = "You are a helpful petroleum industry assistant. ";

        if (context && context.length > 0) {
            systemPrompt += "Use the following context to answer the question:\n\n";
            context.forEach(doc => {
                systemPrompt += `${doc.pageContent || doc.text || ''}\n\n`;
            });
            systemPrompt += "If the context doesn't contain relevant information, just say you don't have enough information.";
        }

        try {
            // Make the API request to Ollama
            logger.info(`Calling Ollama API at ${OLLAMA_API_URL}/api/generate`);
            const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
                model: OLLAMA_MODEL,
                prompt: prompt,
                system: systemPrompt,
                stream: false
            });

            // Return just the response content
            return response.data.response;
        } catch (ollamaError) {
            // If Ollama fails, log the error
            logger.error(`Ollama API failed: ${ollamaError.message}`);
            return "I'm sorry, but I'm currently experiencing technical difficulties. The AI service is unavailable. Please try again later or contact support.";
        }
    } catch (error) {
        logger.error(`Error calling Ollama API service: ${error.message}`);
        return `Failed to get response: ${error.message}`;
    }
};

/**
 * Create a new RAG chat
 * @param {Object} chatData - Chat data
 * @returns {Promise<Object>} - Created chat
 */
async function createChat(chatData) {
    try {
        const chat = await RagChat.create(chatData);
        return chat;
    } catch (error) {
        console.error('Error creating chat:', error);
        throw error;
    }
}

/**
 * Get all chats for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of chats
 */
async function getUserChats(userId) {
    try {
        const chats = await RagChat.find({ user: userId, isActive: true })
            .sort({ updatedAt: -1 })
            .populate('lastMessage');
        return chats;
    } catch (error) {
        console.error(`Error getting chats for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Get a chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} - Chat object
 */
async function getChatById(chatId) {
    try {
        const chat = await RagChat.findById(chatId)
            .populate('documents')
            .populate('lastMessage');
        return chat;
    } catch (error) {
        console.error(`Error getting chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Update a chat
 * @param {string} chatId - Chat ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated chat
 */
async function updateChat(chatId, updateData) {
    try {
        const chat = await RagChat.findByIdAndUpdate(chatId, updateData, { new: true });
        return chat;
    } catch (error) {
        console.error(`Error updating chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Delete a chat (soft delete)
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} - Deleted chat
 */
async function deleteChat(chatId) {
    try {
        const chat = await RagChat.findByIdAndUpdate(
            chatId,
            { isActive: false },
            { new: true }
        );
        return chat;
    } catch (error) {
        console.error(`Error deleting chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Create a message in the database
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} - Created message
 */
const createMessage = async (messageData) => {
    try {
        const message = new RagMessage(messageData);
        await message.save();
        return message;
    } catch (error) {
        logger.error(`Error creating message: ${error.message}`);
        throw new Error(`Failed to create message: ${error.message}`);
    }
};

/**
 * Get all messages for a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} - Array of messages
 */
async function getChatMessages(chatId) {
    try {
        const messages = await RagMessage.find({ chat: chatId })
            .sort({ createdAt: 1 })
            .populate({
                path: 'sources.document',
                select: 'title source fileType'
            });
        return messages;
    } catch (error) {
        console.error(`Error getting messages for chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Process a message and generate a response
 * @param {string} content - Message content
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} - Response object with content and sources
 */
async function processMessage(content, chatId) {
    try {
        logger.info(`Processing message for chat ${chatId}`);

        // Check if this is a project/database info query first
        if (isProjectInfoQuery(content)) {
            const chat = await RagChat.findById(chatId);
            if (!chat) {
                throw new Error('Chat not found');
            }

            const userId = chat.user.toString();
            const response = await handleProjectInfoQuery(content, userId);

            return {
                content: response,
                sources: []
            };
        }

        // Proceed with Ollama processing
        const chat = await RagChat.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }

        // Retrieve context based on the user's query
        const retrievalResults = await retrieveRelevantContext(content, chat);

        // Use Ollama for response
        const contextDocs = retrievalResults.sources.map(s => ({ text: s.text }));
        const prompt = `User question: ${content}\n\nPlease provide a helpful response based on the provided context.`;
        const response = await callOllamaAPI(prompt, contextDocs);

        return {
            content: response,
            sources: retrievalResults.sources
        };
    } catch (error) {
        logger.error(`Error processing message: ${error.message}`);
        return {
            content: "Je suis désolé, une erreur s'est produite lors du traitement de votre message. Veuillez réessayer plus tard.",
            sources: [],
            error: error.message
        };
    }
}

/**
 * Process a user message and generate a response
 * @param {string} chatId - Chat ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} - The created assistant message
 */
async function processUserMessage(chatId, content) {
    try {
        const chat = await RagChat.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }

        // Create user message
        const userMessage = await createMessage({
            chat: chatId,
            content,
            role: 'user'
        });

        // Retrieve context based on the user's query
        const retrievalResults = await retrieveRelevantContext(content, chat);

        // Use Ollama for response
        const contextDocs = retrievalResults.sources.map(s => ({ text: s.text }));
        const prompt = `User question: ${content}\n\nPlease provide a helpful response based on the provided context.`;
        const response = await callOllamaAPI(prompt, contextDocs);

        // Create assistant message with the response
        const assistantMessage = await createMessage({
            chat: chatId,
            content: response,
            role: 'assistant',
            sources: retrievalResults.sources,
            metadata: {
                retrievalMetrics: {
                    totalChunksRetrieved: retrievalResults.totalChunksRetrieved,
                    topRelevanceScore: retrievalResults.topRelevanceScore,
                    retrievalTime: retrievalResults.retrievalTime
                }
            }
        });

        return assistantMessage;
    } catch (error) {
        console.error(`Error processing message for chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Stream a response for a user message
 * @param {string} chatId - Chat ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} - Object with messageId and content stream
 */
async function streamResponse(chatId, content) {
    try {
        const chat = await RagChat.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }

        // Create user message
        const userMessage = await createMessage({
            chat: chatId,
            content,
            role: 'user'
        });

        // Retrieve context based on the user's query
        const retrievalResults = await retrieveRelevantContext(content, chat);

        // Use Ollama for response (non-streaming since Ollama streaming is complex to implement)
        const contextDocs = retrievalResults.sources.map(s => ({ text: s.text }));
        const prompt = `User question: ${content}\n\nPlease provide a helpful response based on the provided context.`;
        const response = await callOllamaAPI(prompt, contextDocs);

        // Create a placeholder for the assistant message
        const assistantMessage = await createMessage({
            chat: chatId,
            content: response,
            role: 'assistant',
            sources: retrievalResults.sources,
            metadata: {
                retrievalMetrics: {
                    totalChunksRetrieved: retrievalResults.totalChunksRetrieved,
                    topRelevanceScore: retrievalResults.topRelevanceScore,
                    retrievalTime: retrievalResults.retrievalTime
                }
            }
        });

        // Create a simple mock stream that returns the full response
        const mockStream = {
            async *[Symbol.asyncIterator]() {
                yield {
                    choices: [{
                        delta: {
                            content: response
                        }
                    }]
                };
            }
        };

        // Return the stream and message ID
        return {
            stream: mockStream,
            messageId: assistantMessage._id
        };
    } catch (error) {
        console.error(`Error streaming response for chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Update a streamed message with the complete content
 * @param {string} messageId - Message ID
 * @param {string} content - Complete content
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Updated message
 */
async function updateStreamedMessage(messageId, content, metadata = {}) {
    try {
        const message = await RagMessage.findByIdAndUpdate(
            messageId,
            {
                content,
                metadata: {
                    ...metadata
                }
            },
            { new: true }
        );

        return message;
    } catch (error) {
        console.error(`Error updating streamed message ${messageId}:`, error);
        throw error;
    }
}

// Existing code for retrieving relevant context (if not already defined)
async function retrieveRelevantContext(query, chat) {
    try {
        const startTime = Date.now();

        // Get relevant documents using the retrieval service
        const { documents, relevanceScores } = await retrieveRelevantDocuments(query);

        // Calculate retrieval metrics
        const retrievalTime = Date.now() - startTime;
        const topRelevanceScore = relevanceScores.length > 0 ? Math.max(...relevanceScores) : 0;

        // Format sources for citation
        const sources = documents.map((doc, index) => ({
            document: doc.documentId,
            text: doc.text,
            relevanceScore: relevanceScores[index]
        }));

        return {
            sources,
            contextText: documents.map(doc => doc.text).join('\n\n'),
            totalChunksRetrieved: documents.length,
            topRelevanceScore,
            retrievalTime
        };
    } catch (error) {
        logger.error(`Error retrieving context: ${error.message}`);
        return {
            sources: [],
            contextText: '',
            totalChunksRetrieved: 0,
            topRelevanceScore: 0,
            retrievalTime: 0
        };
    }
}

// Existing code for formatting message history (if not already defined)
async function formatMessageHistory(chatId, retrievalResults) {
    try {
        // Get chat history
        const messages = await RagMessage.find({ chat: chatId })
            .sort({ createdAt: 1 })
            .limit(10); // Limit to last 10 messages for context window

        // Format messages for OpenAI API
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add system message with context at the beginning
        const systemMessage = {
            role: 'system',
            content: `You are a helpful assistant. Use the following context to answer the user's question.\n\nContext:\n${retrievalResults.contextText}`
        };

        return [systemMessage, ...formattedMessages];
    } catch (error) {
        logger.error(`Error formatting message history: ${error.message}`);
        return [];
    }
}

module.exports = {
    processUserMessage,
    createMessage,
    createChat,
    getUserChats,
    getChatById,
    updateChat,
    deleteChat,
    getChatMessages,
    callOllamaAPI,
    isProjectInfoQuery,
    handleProjectInfoQuery,
    streamResponse,
    updateStreamedMessage,
    processMessage
}; 