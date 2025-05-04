import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, Cog6ToothIcon, ArrowLeftIcon, ArrowUpTrayIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { AnimatedUploadIcon } from './AnimatedUploadIcon';
import NotificationDropdown from '../header/NotificationDropdown';

interface Message {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    isCurrentUser: boolean;
    avatar: string;
    fileUrl?: string;
    fileName?: string;
}

interface Member {
    id: string;
    name: string;
    avatar: string;
    isAdmin?: boolean;
    isOnline?: boolean;
    email?: string;
}

interface ChatWindowProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isTyping?: boolean;
    typingUser?: string;
    isLoading?: boolean;
    participants?: Member[];
    isGroup?: boolean;
}

type ChatMode = 'messages' | 'participants';

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    onSendMessage,
    isTyping,
    typingUser,
    isLoading = false,
    participants = [],
    isGroup = false
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [mode, setMode] = useState<ChatMode>('messages');
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or when typing starts
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Function to scroll to bottom of messages
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const simulateUpload = (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setUploadedFile(null);
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20 + 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setUploading(false);
                    setUploadProgress(100);
                    setUploadedFile({ name: file.name, url: URL.createObjectURL(file) });
                }, 400);
            }
            setUploadProgress(progress);
        }, 300);
    };

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
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            simulateUpload(files[0]);
        }
    };

    const handleSendFileMessage = () => {
        if (uploadedFile) {
            onSendMessage(`file:${uploadedFile.name}`);
            setUploadedFile(null);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            onSendMessage(messageInput.trim());
            setMessageInput('');
        }
    };

    return (
        <div
            className="w-full h-full flex flex-col bg-gray-100 relative overflow-hidden"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            ref={dropRef}
        >
            {/* Blurred Header */}
            <motion.header
                className="flex items-center px-6 py-3 backdrop-blur-md backdrop-saturate-150 bg-white/90 border-b border-gray-200 shadow-sm sticky top-0 z-40"
            >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button className="p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold text-gray-800 truncate">
                            {isGroup ? 'Group Chat' : 'Direct Message'}
                            {participants && participants.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                    ({participants.length} {participants.length === 1 ? 'participant' : 'participants'})
                                </span>
                            )}
                        </span>
                        {isTyping && (
                            <span className="text-xs text-green-600 flex items-center">
                                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                {typingUser || 'Someone'} is typing...
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'messages'
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:text-green-700'
                            }`}
                        onClick={() => setMode('messages')}
                    >
                        Messages
                    </button>
                    <button
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'participants'
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:text-green-700'
                            }`}
                        onClick={() => setMode('participants')}
                    >
                        Participants
                    </button>
                    <div className="mx-1">
                        <NotificationDropdown />
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-100">
                        <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </motion.header>

            {/* Main Content Area: Only messages list scrolls */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {mode === 'messages' && (
                    <div
                        className={`flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 ${dragActive ? 'pointer-events-none blur-sm opacity-70' : ''}`}
                        style={{ maxHeight: '100%' }}
                        ref={messageContainerRef}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Loading messages...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex ${message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[75%]`}>
                                            <img
                                                src={message.avatar}
                                                alt={message.sender}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div>
                                                <div className={`text-xs text-gray-500 ${message.isCurrentUser ? 'text-right' : ''}`}>
                                                    {message.sender} {message.timestamp && `• ${message.timestamp}`}
                                                </div>
                                                <div
                                                    className={`mt-1 px-3 py-2 rounded-lg ${message.isCurrentUser
                                                        ? 'bg-green-100 text-gray-900'
                                                        : 'bg-white text-gray-800 border border-gray-200'
                                                        }`}
                                                >
                                                    {message.content}
                                                    {'fileUrl' in message && (message as Message).fileUrl && (
                                                        <div className="flex items-center mt-2 bg-white border border-gray-100 rounded-md p-2">
                                                            <ArrowUpTrayIcon className="w-4 h-4 text-green-500 mr-2" />
                                                            <span className="text-sm text-gray-700">{(message as Message).fileName ?? ''}</span>
                                                            <a href={(message as Message).fileUrl ?? ''} download className="ml-auto text-green-500 text-xs hover:underline">Download</a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        {isTyping && (
                            <div className="flex items-center py-2 px-4 bg-white shadow-sm rounded-full border border-gray-100 animate-pulse">
                                <div className="flex items-center space-x-1 text-green-600 text-sm">
                                    <span>{typingUser || 'Someone'} is typing</span>
                                    <span className="flex">
                                        <span className="animate-bounce">.</span>
                                        <span className="animate-bounce delay-100">.</span>
                                        <span className="animate-bounce delay-200">.</span>
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* Invisible element to scroll to */}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {mode === 'participants' && (
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                Participants
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({participants.length})
                                </span>
                            </h3>

                            {participants.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                                    <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No participants found.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {participants.map((member) => (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                />
                                                {member.isOnline !== undefined && (
                                                    <div
                                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white ${member.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    />
                                                )}
                                            </div>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <div className="flex items-center">
                                                    <p className="font-medium text-gray-800 truncate">{member.name}</p>
                                                    {member.isAdmin && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                {member.email && (
                                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Drag overlay */}
                {dragActive && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-gray-900/20 backdrop-blur-sm pointer-events-none">
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden px-8 py-6 max-w-md w-full flex flex-col items-center justify-center">
                            <AnimatedUploadIcon />
                            <p className="text-gray-800 font-medium text-center pb-4">Drop your file to upload</p>
                        </div>
                    </div>
                )}

                {/* Uploading progress */}
                {uploading && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 mr-3 flex-shrink-0">
                                <svg className="w-full h-full text-green-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                                    <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full">
                                    <div className="h-2 bg-green-500 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* File ready to send */}
                {!uploading && uploadedFile && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg mr-3 flex items-center justify-center flex-shrink-0">
                                <ArrowUpTrayIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 minw-0">
                                <span className="text-sm font-medium text-gray-700 truncate block">{uploadedFile.name}</span>
                                <span className="text-xs text-gray-500">Ready to send</span>
                            </div>
                            <button
                                onClick={handleSendFileMessage}
                                className="ml-3 px-3 py-1.5 bg-green-500 text-white text-sm rounded-md shadow-sm hover:bg-green-600"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'messages' && !uploading && !uploadedFile && (
                    <form onSubmit={handleSendMessage} className="px-6 py-3 bg-white border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            />
                            <button
                                type="button"
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                            >
                                <ArrowUpTrayIcon className="w-5 h-5" />
                            </button>
                            <motion.button
                                type="submit"
                                className="bg-green-500 p-2.5 rounded-full text-white shadow-md"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};