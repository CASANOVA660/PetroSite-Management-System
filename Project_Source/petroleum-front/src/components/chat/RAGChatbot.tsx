import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import {
    PaperAirplaneIcon,
    PlusIcon
} from '@heroicons/react/24/solid';
import {
    ArrowPathIcon,
    XMarkIcon,
    DocumentTextIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    DocumentIcon,
    TrashIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowUpTrayIcon,
    DocumentPlusIcon,
    ServerIcon
} from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '../../store';
import { createChat, sendMessage, sendQueryDirectly, setIsTyping, selectRagIsTyping, getDocuments, deleteDocument, uploadDocument, selectRagDocuments, selectRagLoading, selectCurrentRagChat } from '../../store/slices/ragChatSlice';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: string;
    content: string;
    timestamp: Date;
    isBot?: boolean;
}

interface ChatHistory {
    id: string;
    title: string;
    date: Date;
    lastMessage: string;
}

const RAGChatbot: React.FC = () => {
    const { theme } = useTheme();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [isManager, setIsManager] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'chats' | 'documents' | 'upload'>('chats');

    // Document Upload State
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Document List State
    const documents = useSelector(selectRagDocuments);
    const loading = useSelector(selectRagLoading);

    // Original mock chat history
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
        {
            id: '1',
            title: 'Project Analysis',
            date: new Date(Date.now() - 86400000), // yesterday
            lastMessage: 'How to improve project performance?'
        },
        {
            id: '2',
            title: 'Budget Review',
            date: new Date(Date.now() - 172800000), // 2 days ago
            lastMessage: 'Help me analyze the quarterly budget'
        },
        {
            id: '3',
            title: 'Team Productivity',
            date: new Date(Date.now() - 345600000), // 4 days ago
            lastMessage: 'Strategies for improving team workflow'
        },
        {
            id: '4',
            title: 'RAG Chatbot in Node',
            date: new Date(Date.now() - 86400000), // yesterday
            lastMessage: 'How can I implement a RAG chatbot?'
        },
        {
            id: '5',
            title: 'Class Diagram Field Format',
            date: new Date(Date.now() - 86400000), // yesterday
            lastMessage: 'What\'s the best format for class diagrams?'
        },
        {
            id: '6',
            title: 'Mongoose ODM vs ORM',
            date: new Date(Date.now() - 86400000), // yesterday
            lastMessage: 'Explain the difference between ODM and ORM'
        }
    ]);

    // Add this line near the top of the component
    const currentChat = useSelector(selectCurrentRagChat);

    // Update useEffect to sync messages when currentChat changes
    useEffect(() => {
        if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
            // Convert API messages to our local Message format
            const formattedMessages = currentChat.messages.map(apiMsg => ({
                id: apiMsg._id,
                content: apiMsg.content,
                isBot: apiMsg.role === 'assistant',
                timestamp: new Date(apiMsg.createdAt)
            }));

            setMessages(formattedMessages);
            setShowWelcome(false);
        }
    }, [currentChat]);

    // Fetch documents on component mount
    useEffect(() => {
        dispatch(getDocuments());
    }, [dispatch]);

    // Check if user has manager role (case insensitive)
    useEffect(() => {
        if (user && (user.role?.toLowerCase() === 'manager')) {
            setIsManager(true);
        } else {
            setIsManager(false);
        }
    }, [user]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Log initial sidebar state
    useEffect(() => {
        console.log('Initial sidebar state:', isSidebarOpen);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Add state for direct database querying
    const [useDirectQuery, setUseDirectQuery] = useState(false);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim()) return;

        // Hide welcome screen when first message is sent
        if (showWelcome) {
            setShowWelcome(false);
        }

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: input,
            timestamp: new Date(),
            isBot: false,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Check if we're in direct query mode
        if (useDirectQuery) {
            // Call the database query API
            dispatch(sendQueryDirectly({
                content: input
            }))
                .then((response: any) => {
                    if (response.payload) {
                        // Create a bot message with the response
                        const botMessage: Message = {
                            id: (Date.now() + 1).toString(),
                            content: response.payload.content || 'No response from database',
                            timestamp: new Date(),
                            isBot: true,
                        };
                        setMessages(prev => [...prev, botMessage]);
                    } else if (response.error) {
                        // Handle error
                        const errorMessage: Message = {
                            id: (Date.now() + 1).toString(),
                            content: `Error: ${response.error}. Try rephrasing your query or switching to RAG mode.`,
                            timestamp: new Date(),
                            isBot: true,
                        };
                        setMessages(prev => [...prev, errorMessage]);
                    }
                    setIsTyping(false);
                })
                .catch((error: any) => {
                    // Handle API error
                    const errorMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        content: 'Sorry, there was an error processing your database query. Please try again.',
                        timestamp: new Date(),
                        isBot: true,
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    setIsTyping(false);
                    console.error('Database query error:', error);
                });
        } else {
            // Original RAG chatbot logic
            setTimeout(() => {
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: 'This is a simulated response from the RAG chatbot. In a real implementation, this would be generated based on your query using the RAG (Retrieval Augmented Generation) system that searches through your company documents and knowledge base.',
                    timestamp: new Date(),
                    isBot: true,
                };

                setMessages(prev => [...prev, botMessage]);
                setIsTyping(false);
            }, 2000);
        }
    };

    const refreshPrompts = () => {
        // Simulate refreshing prompts
        console.log('Refreshing prompts');
    };

    const startNewChat = async () => {
        try {
            // Create a new chat in the backend
            const resultAction = await dispatch(createChat({
                title: 'New Chat'
            }));

            if (createChat.fulfilled.match(resultAction)) {
                setCurrentChatId(resultAction.payload._id);
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
        }

        // Keep existing UI behavior
        setMessages([]);
        setShowWelcome(true);
    };

    const toggleSidebar = () => {
        console.log('Current sidebar state:', isSidebarOpen);
        setIsSidebarOpen(prevState => {
            const newState = !prevState;
            console.log('New sidebar state:', newState);
            return newState;
        });
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date >= today) {
            return 'Today';
        } else if (date >= yesterday) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
    };

    // Group chat history by date
    const groupedChatHistory = chatHistory.reduce((acc, chat) => {
        const dateKey = formatDate(chat.date);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(chat);
        return acc;
    }, {} as Record<string, ChatHistory[]>);

    // Add this function to check if device is mobile
    const isMobile = () => {
        return window.innerWidth < 768;
    };

    // Add a state for tracking mobile view
    const [isMobileView, setIsMobileView] = useState(false);

    // Add useEffect to handle window resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobileView(isMobile());
        };

        // Check on mount
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Document upload handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setTitle(e.dataTransfer.files[0].name.split('.')[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setTitle(e.target.files[0].name.split('.')[0]);
        }
    };

    const handleDocumentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        if (description) formData.append('description', description);

        try {
            await dispatch(uploadDocument({ formData }));
            setFile(null);
            setTitle('');
            setDescription('');
            dispatch(getDocuments());
        } catch (error) {
            console.error('Error uploading document:', error);
        }
    };

    const fetchDocuments = async () => {
        await dispatch(getDocuments());
    };

    const handleDeleteDocument = async (documentId: string) => {
        if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            await dispatch(deleteDocument(documentId));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <ClockIcon className="h-5 w-5 text-yellow-500" title="Pending" />;
            case 'processing':
                return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" title="Processing" />;
            case 'embedded':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Processed" />;
            case 'failed':
                return <ExclamationCircleIcon className="h-5 w-5 text-red-500" title="Failed" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" title="Unknown" />;
        }
    };

    const getFileTypeIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf':
                return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
            case 'txt':
                return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
            case 'html':
                return <DocumentTextIcon className="h-8 w-8 text-purple-500" />;
            case 'docx':
                return <DocumentTextIcon className="h-8 w-8 text-indigo-500" />;
            default:
                return <DocumentIcon className="h-8 w-8 text-gray-500" />;
        }
    };

    const renderSidebarContent = () => {
        switch (sidebarTab) {
            case 'documents':
                return renderDocumentList();
            case 'upload':
                return renderDocumentUpload();
            case 'chats':
            default:
                return renderChatHistory();
        }
    };

    const renderDocumentList = () => {
        if (loading && documents.length === 0) {
            return (
                <div className={`w-full p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <DocumentTextIcon className="h-6 w-6 mr-2 text-green-500" />
                        Knowledge Base
                    </h2>
                    <div className="flex justify-center items-center py-8">
                        <ArrowPathIcon className="h-8 w-8 text-green-500 animate-spin" />
                        <p className="ml-2">Loading documents...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className={`w-full p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                        <DocumentTextIcon className="h-6 w-6 mr-2 text-green-500" />
                        Knowledge Base
                    </h2>
                    <button
                        onClick={fetchDocuments}
                        className={`p-2 ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'}`}
                        title="Refresh documents"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-8">
                        <DocumentIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No documents have been uploaded yet.</p>
                        <p className="text-sm mt-2">Upload a document to use in the chatbot.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc._id}
                                className={`border rounded-lg p-3 flex items-start ${theme === 'dark'
                                    ? 'border-gray-700 hover:bg-gray-750'
                                    : 'border-gray-200 hover:bg-gray-50'} transition`}
                            >
                                <div className="mr-3 flex-shrink-0">
                                    {getFileTypeIcon(doc.fileType)}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-medium truncate">
                                            {doc.title}
                                        </h3>
                                        {getStatusIcon(doc.processingStatus)}
                                    </div>

                                    {doc.description && (
                                        <p className={`text-sm mt-1 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {doc.description}
                                        </p>
                                    )}

                                    <div className={`flex items-center mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} space-x-4`}>
                                        <span>
                                            {doc.fileType.toUpperCase()}
                                        </span>
                                        <span>
                                            {doc.chunkCount} chunks
                                        </span>
                                        <span>
                                            {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteDocument(doc._id)}
                                    className={`ml-2 p-2 rounded-full ${theme === 'dark'
                                        ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                                    title="Delete document"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderDocumentUpload = () => {
        const acceptedFileTypes = ['.pdf', '.txt', '.docx', '.html'];

        return (
            <div className={`w-full p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <DocumentPlusIcon className="h-6 w-6 mr-2 text-green-500" />
                    Upload Document
                </h2>

                <form onSubmit={handleDocumentSubmit}>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center ${dragActive
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-300 hover:border-gray-400'
                            } transition-all cursor-pointer`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <DocumentPlusIcon className="h-8 w-8 text-green-500 mr-3" />
                                    <div className="text-left">
                                        <p className="font-medium">{file.name}</p>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setTitle('');
                                    }}
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <ArrowUpTrayIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
                                <p className="mb-1 font-medium">
                                    Drag and drop your document here
                                </p>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    or click to browse files
                                </p>
                                <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Accepted file types: {acceptedFileTypes.join(', ')}
                                </p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept={acceptedFileTypes.join(',')}
                        />
                    </div>

                    <div className="space-y-3 mb-4">
                        <div>
                            <label htmlFor="title" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className={`w-full px-3 py-2 border rounded-md ${theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-green-600'
                                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                                placeholder="Document title"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Description <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md ${theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-green-600'
                                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                                placeholder="Brief description of the document content"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || loading || !title}
                        className={`w-full flex justify-center items-center py-2 px-4 rounded-md
                            ${file && title && !loading
                                ? theme === 'dark'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                : theme === 'dark'
                                    ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            } transition-colors`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            'Upload Document'
                        )}
                    </button>
                </form>
            </div>
        );
    };

    const renderChatHistory = () => {
        // Original chat history render function contents
        return (
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Chat History</h2>
                    <button
                        onClick={startNewChat}
                        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-green-400 hover:bg-gray-700' : 'bg-gray-100 text-green-600 hover:bg-gray-200'}`}
                        aria-label="New chat"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>

                {Object.entries(groupedChatHistory).map(([date, chats]) => (
                    <div key={date} className="mb-4">
                        <h3 className={`text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {date}
                        </h3>
                        <div className="space-y-1">
                            {chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    className={`w-full text-left p-2 rounded-lg hover:bg-opacity-80 transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                                    onClick={() => console.log('Load chat', chat.id)}
                                >
                                    <div className="font-medium truncate">{chat.title}</div>
                                    <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {chat.lastMessage}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {chatHistory.length === 0 && (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>No chat history yet</p>
                        <p className="text-sm mt-1">Start a new conversation</p>
                    </div>
                )}
            </div>
        );
    };

    // If not manager, show access denied
    if (!isManager) {
        return (
            <div className={`fixed inset-0 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <div className="text-center p-8 rounded-lg">
                    <XMarkIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-lg">Only managers can access the RAG chatbot.</p>
                </div>
            </div>
        );
    }

    // Add this function after handleSendMessage
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    return (
        <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full z-20 md:static transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0'} 
                ${theme === 'dark' ? 'bg-gray-850 border-gray-700' : 'bg-white border-gray-200'} 
                border-l shadow-lg md:shadow-none flex-shrink-0 w-full md:w-80 md:max-w-xs`}
            >
                {/* Tab Navigation */}
                <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                        onClick={() => setSidebarTab('chats')}
                        className={`flex-1 py-3 text-center transition ${sidebarTab === 'chats'
                            ? theme === 'dark'
                                ? 'text-green-400 border-b-2 border-green-400'
                                : 'text-green-600 border-b-2 border-green-600'
                            : theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Chats
                    </button>
                    <button
                        onClick={() => setSidebarTab('documents')}
                        className={`flex-1 py-3 text-center transition ${sidebarTab === 'documents'
                            ? theme === 'dark'
                                ? 'text-green-400 border-b-2 border-green-400'
                                : 'text-green-600 border-b-2 border-green-600'
                            : theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Documents
                    </button>
                    <button
                        onClick={() => setSidebarTab('upload')}
                        className={`flex-1 py-3 text-center transition ${sidebarTab === 'upload'
                            ? theme === 'dark'
                                ? 'text-green-400 border-b-2 border-green-400'
                                : 'text-green-600 border-b-2 border-green-600'
                            : theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Upload
                    </button>
                </div>

                {/* Sidebar Content - Conditionally render based on selected tab */}
                <div className="h-full overflow-y-auto">
                    {renderSidebarContent()}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex flex-col flex-1 h-full overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:mr-80' : ''}`}>
                {/* Chat Header */}
                <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'bg-gray-850 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {useDirectQuery ? 'Database Query Mode' : 'RAG Chatbot'}
                    </h1>
                    <div className="flex items-center space-x-2">
                        {/* Direct Query Toggle */}
                        <button
                            onClick={() => setUseDirectQuery(!useDirectQuery)}
                            className={`p-2 rounded-full flex items-center ${useDirectQuery
                                ? theme === 'dark'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-500 text-white'
                                : theme === 'dark'
                                    ? 'hover:bg-gray-800 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            aria-label={useDirectQuery ? "Switch to RAG mode" : "Switch to Database Query mode"}
                            title={useDirectQuery ? "Currently in Database Query mode" : "Click to switch to Database Query mode"}
                        >
                            <ServerIcon className="h-5 w-5" />
                            <span className="ml-1 text-xs hidden sm:inline">
                                {useDirectQuery ? "DB Query" : "RAG Mode"}
                            </span>
                        </button>
                        <button
                            onClick={refreshPrompts}
                            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                            aria-label="Refresh prompts"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={toggleSidebar}
                            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            {isSidebarOpen ? (
                                <ChevronRightIcon className="h-5 w-5" />
                            ) : (
                                <ChevronLeftIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    {showWelcome && (
                        <div className={`mb-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow`}>
                            <h2 className="text-xl font-semibold mb-2">
                                {useDirectQuery ? 'Database Query Mode' : 'Welcome to the RAG Chatbot!'}
                            </h2>
                            <p className="mb-3">
                                {useDirectQuery
                                    ? 'Ask me anything about your database - projects, tasks, and users. I have direct access to retrieve real-time information!'
                                    : 'Ask me anything related to the documents in our knowledge base.'}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {useDirectQuery
                                    ? 'This mode directly queries the database for up-to-date information. Try asking about projects, tasks, or user statistics.'
                                    : 'This chatbot uses Retrieval Augmented Generation to provide accurate answers based on your document library.'}
                            </p>
                            {/* Prompt suggestions */}
                            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                {useDirectQuery ? (
                                    // DB Query Mode prompts
                                    <>
                                        <button
                                            onClick={() => setInput("List all projects")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            List all projects
                                        </button>
                                        <button
                                            onClick={() => setInput("How many projects are currently in operation?")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            How many projects are currently in operation?
                                        </button>
                                        <button
                                            onClick={() => setInput("Which users are currently active?")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Which users are currently active?
                                        </button>
                                        <button
                                            onClick={() => setInput("Show me tasks with upcoming deadlines")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Show me tasks with upcoming deadlines
                                        </button>
                                    </>
                                ) : (
                                    // Original RAG prompts
                                    <>
                                        <button
                                            onClick={() => setInput("Get fresh perspectives on tricky problems")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Get fresh perspectives on tricky problems
                                        </button>
                                        <button
                                            onClick={() => setInput("Brainstorm creative ideas")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Brainstorm creative ideas
                                        </button>
                                        <button
                                            onClick={() => setInput("Rewrite message for maximum impact")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Rewrite message for maximum impact
                                        </button>
                                        <button
                                            onClick={() => setInput("Summarize key points")}
                                            className="px-4 py-3 rounded-lg text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Summarize key points
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg shadow-sm 
                                ${message.isBot
                                        ? theme === 'dark'
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-white text-gray-900'
                                        : theme === 'dark'
                                            ? 'bg-green-700 text-white'
                                            : 'bg-green-600 text-white'
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">
                                    {message.content}
                                </div>
                                <div
                                    className={`text-xs mt-1 ${message.isBot
                                        ? theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-500'
                                        : 'text-green-200'
                                        }`}
                                >
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div
                                className={`max-w-[80%] p-3 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                            >
                                <div className="flex space-x-1">
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }}></div>
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '150ms' }}></div>
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-850 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className={`w-full p-3 rounded-lg resize-none min-h-[50px] max-h-[150px] overflow-auto focus:outline-none focus:ring-2 ${theme === 'dark'
                                    ? 'bg-gray-800 text-white border-gray-700 focus:ring-green-500'
                                    : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-green-600'}`}
                                rows={1}
                            />
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Press Shift + Enter for a new line
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={`p-3 rounded-lg ${input.trim()
                                ? theme === 'dark'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                : theme === 'dark'
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center mt-3">
                    <span className="text-xs font-medium mr-1">
                        {useDirectQuery ? "Database Query Mode" : "ThinkAI 3.5 Smart"}
                    </span>
                    <span className="text-xs text-blue-500 dark:text-blue-400">
                        {useDirectQuery ? "◆ Real-time" : "◆ Format"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RAGChatbot;