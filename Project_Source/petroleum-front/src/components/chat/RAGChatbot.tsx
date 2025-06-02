import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid';
import {
    XMarkIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { RootState } from '../../store';

interface Message {
    id: string;
    content: string;
    timestamp: Date;
    isBot: boolean;
}

interface ChatHistory {
    id: string;
    title: string;
    date: Date;
    lastMessage: string;
}

const RAGChatbot: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useSelector((state: RootState) => state.auth);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [isManager, setIsManager] = useState(false);
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
        console.log('Initial sidebar state:', sidebarOpen);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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

        // Simulate bot response after a delay
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
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const refreshPrompts = () => {
        // Simulate refreshing prompts
        console.log('Refreshing prompts');
    };

    const startNewChat = () => {
        setMessages([]);
        setShowWelcome(true);
    };

    const toggleSidebar = () => {
        console.log('Current sidebar state:', sidebarOpen);
        setSidebarOpen(prevState => {
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

    return (
        <div className="fixed inset-0 flex overflow-hidden">
            {/* Main chat area */}
            <div className={`flex-1 flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative transition-all duration-300 ml-72 ${sidebarOpen ? 'mr-72' : 'mr-0'}`}>
                {/* Header - fixed at top with higher z-index */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-20 relative">
                    <div className="flex items-center">
                        <div className="text-xl font-bold flex items-center">
                            <span className="mr-1">ThinkAI</span>
                            {theme === 'dark' ? (
                                <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">M</span>
                            ) : (
                                <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">M</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {sidebarOpen ? (
                            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        ) : (
                            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        )}
                    </button>
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {showWelcome ? (
                        /* Welcome screen */
                        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 overflow-y-auto">
                            {/* Logo and greeting */}
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                                <div className="w-full h-full bg-gradient-to-b from-green-400 to-green-100 dark:from-green-500 dark:to-green-300"></div>
                            </div>
                            <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white text-center">
                                Good evening, {user?.nom || 'Milovan'}
                            </h1>
                            <p className="text-xl mb-4 text-gray-900 dark:text-white text-center">
                                Can I help you with anything?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                                Choose a prompt below or write your own to start chatting with ThinkAI
                            </p>

                            {/* Prompt suggestions */}
                            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
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
                            </div>

                            {/* Refresh prompts button */}
                            <button
                                onClick={refreshPrompts}
                                className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-8 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                                Refresh prompts
                            </button>
                        </div>
                    ) : (
                        /* Chat screen */
                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            <div className="max-w-3xl mx-auto">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`mb-4 ${message.isBot ? 'flex' : 'flex justify-end'}`}
                                    >
                                        {message.isBot && (
                                            <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                                <div className="w-full h-full bg-gradient-to-b from-green-400 to-green-100 dark:from-green-500 dark:to-green-300"></div>
                                            </div>
                                        )}
                                        <div
                                            className={`p-3 rounded-lg max-w-[80%] ${message.isBot
                                                ? theme === 'dark'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                                : theme === 'dark'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-green-500 text-white'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                            <p className={`text-xs mt-1 ${message.isBot ? (theme === 'dark' ? 'text-gray-400' : 'text-gray-500') : 'text-green-100'}`}>
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!message.isBot && (
                                            <div className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0">
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    <span className="text-sm font-medium">{user?.nom?.charAt(0) || 'U'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex mb-4">
                                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                            <div className="w-full h-full bg-gradient-to-b from-green-400 to-green-100 dark:from-green-500 dark:to-green-300"></div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
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
                        </div>
                    )}
                </div>

                {/* Input field */}
                <div className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea
                                ref={inputRef}
                                className="w-full p-4 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                placeholder="How can ThinkAI help you today?"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                style={{ minHeight: '56px', maxHeight: '200px' }}
                            />
                            <div className="absolute right-3 bottom-3">
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className={`p-1.5 rounded-md ${input.trim()
                                        ? 'text-green-500 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        : 'text-gray-400 dark:text-gray-600'
                                        }`}
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                            <div>
                                <span>ThinkAI can make mistakes. Please double-check responses.</span>
                            </div>
                            <div>
                                <span>Use <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">shift</kbd> + <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">return</kbd> for new line</span>
                            </div>
                        </div>

                        <div className="flex items-center mt-3">
                            <span className="text-xs font-medium mr-1">ThinkAI 3.5 Smart</span>
                            <span className="text-xs text-blue-500 dark:text-blue-400">◆ Format</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right sidebar - chat history */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-72 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    } ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-l border-gray-200 dark:border-gray-700 z-40 shadow-lg`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-medium">Chat History</h2>
                        <button
                            onClick={startNewChat}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <PlusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>

                    {/* Rest of sidebar content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* New chat button */}
                        <button
                            onClick={startNewChat}
                            className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                            <PlusIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                            <span>New chat</span>
                        </button>

                        <div className="flex justify-end px-4 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Recent chats</p>
                        </div>

                        {/* Chat history list */}
                        {Object.entries(groupedChatHistory).map(([date, chats]) => (
                            <div key={date} className="mb-4">
                                <h3 className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1 px-3">{date}</h3>
                                {chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        className="w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                                        onClick={() => {
                                            setShowWelcome(false);
                                            // Simulate loading chat history
                                            setMessages([
                                                {
                                                    id: '1',
                                                    content: chat.lastMessage,
                                                    timestamp: chat.date,
                                                    isBot: false,
                                                },
                                                {
                                                    id: '2',
                                                    content: 'This is a previous chat history response',
                                                    timestamp: new Date(chat.date.getTime() + 60000),
                                                    isBot: true,
                                                }
                                            ]);
                                        }}
                                    >
                                        <div className="font-medium truncate">{chat.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage}</div>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RAGChatbot; 