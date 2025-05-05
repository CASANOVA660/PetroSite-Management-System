import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, Cog6ToothIcon, ArrowLeftIcon, ArrowUpTrayIcon, UserCircleIcon, UserGroupIcon, DocumentIcon, PaperClipIcon } from '@heroicons/react/24/solid';
import { XMarkIcon, PhotoIcon, FilmIcon, DocumentTextIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { AnimatedUploadIcon } from './AnimatedUploadIcon';
import NotificationDropdown from '../header/NotificationDropdown';
import axios from '../../utils/axios';

interface Message {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    isCurrentUser: boolean;
    avatar: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
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
    onSendMessage: (message: string, file?: File) => void;
    isTyping?: boolean;
    typingUser?: string;
    isLoading?: boolean;
    participants?: Member[];
    isGroup?: boolean;
    groupPictureUrl?: string;
    chatId?: string;
}

type ChatMode = 'messages' | 'participants';

// Helper function to get file icon and style based on type
const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
        return { icon: <PhotoIcon className="w-5 h-5 text-indigo-600" />, bgColor: 'bg-indigo-50' };
    } else if (fileType.startsWith('video/')) {
        return { icon: <FilmIcon className="w-5 h-5 text-red-600" />, bgColor: 'bg-red-50' };
    } else if (fileType.includes('pdf')) {
        return { icon: <DocumentTextIcon className="w-5 h-5 text-red-600" />, bgColor: 'bg-red-50' };
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) {
        return { icon: <DocumentTextIcon className="w-5 h-5 text-green-600" />, bgColor: 'bg-green-50' };
    } else if (fileType.includes('word') || fileType.includes('document')) {
        return { icon: <DocumentTextIcon className="w-5 h-5 text-blue-600" />, bgColor: 'bg-blue-50' };
    } else {
        return { icon: <DocumentIcon className="w-5 h-5 text-gray-600" />, bgColor: 'bg-gray-50' };
    }
};

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    onSendMessage,
    isTyping,
    typingUser,
    isLoading = false,
    participants = [],
    isGroup = false,
    groupPictureUrl,
    chatId
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [mode, setMode] = useState<ChatMode>('messages');
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = async (file: File) => {
        // Reset states
        setUploadedFilePreview(null);
        setFileError(null);
        setUploading(true);
        setUploadProgress(0);

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setFileError('File size exceeds 10MB limit');
            setUploading(false);
            return;
        }

        try {
            // Create a preview for images and videos
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setUploadedFilePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
            }

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    const newProgress = prev + Math.random() * 15;
                    if (newProgress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            setUploadedFile(file);
                            setUploading(false);
                            setUploadProgress(100);
                        }, 300);
                        return 100;
                    }
                    return newProgress;
                });
            }, 200);

        } catch (error) {
            console.error('Error processing file:', error);
            setFileError('Error processing file');
            setUploading(false);
        }
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
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleBrowseClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSendFileMessage = () => {
        if (uploadedFile) {
            onSendMessage(messageInput, uploadedFile);
            setUploadedFile(null);
            setUploadedFilePreview(null);
            setMessageInput('');
        }
    };

    const handleCancelUpload = () => {
        setUploadedFile(null);
        setUploadedFilePreview(null);
        setFileError(null);
        setUploading(false);
        setUploadProgress(0);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            onSendMessage(messageInput.trim());
            setMessageInput('');
        }
    };

    // Function to render message content based on type
    const renderMessageContent = (message: Message) => {
        // If message has a file attached
        if (message.fileUrl) {
            // Check if it's an image
            if (message.fileType?.startsWith('image/')) {
                return (
                    <div className="mt-1 flex flex-col">
                        <div className="relative group rounded-lg overflow-hidden mb-1">
                            <img
                                src={message.fileUrl}
                                alt={message.fileName || 'Image'}
                                className="max-w-full rounded-lg max-h-[300px] object-contain bg-white"
                            />
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={message.fileUrl}
                                    download={message.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                                >
                                    <DocumentArrowDownIcon className="w-4 h-4 text-gray-700" />
                                </a>
                            </div>
                        </div>
                        {message.content && <p className="mt-1">{message.content}</p>}
                    </div>
                );
            }

            // Check if it's a video
            else if (message.fileType?.startsWith('video/')) {
                return (
                    <div className="mt-1 flex flex-col">
                        <div className="relative rounded-lg overflow-hidden mb-1">
                            <video
                                src={message.fileUrl}
                                controls
                                className="max-w-full rounded-lg max-h-[300px]"
                            />
                        </div>
                        {message.content && <p className="mt-1">{message.content}</p>}
                    </div>
                );
            }

            // For other file types
            else {
                const { icon, bgColor } = getFileIcon(message.fileType || '');
                return (
                    <div className="mt-1 flex flex-col">
                        <div className={`${bgColor} rounded-lg p-3 flex items-center mb-1`}>
                            <div className="mr-3">{icon}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{message.fileName}</p>
                                <p className="text-xs text-gray-500">{message.fileSize}</p>
                            </div>
                            <a
                                href={message.fileUrl}
                                download={message.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <DocumentArrowDownIcon className="w-4 h-4 text-gray-700" />
                            </a>
                        </div>
                        {message.content && <p className="mt-1">{message.content}</p>}
                    </div>
                );
            }
        }

        // Regular text message
        return <p>{message.content}</p>;
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
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Blurred Header */}
            <motion.header
                className="flex items-center px-6 py-3 backdrop-blur-md backdrop-saturate-150 bg-white/90 border-b border-gray-200 shadow-sm sticky top-0 z-40"
            >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button className="p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    {/* Avatar in header */}
                    <div className="relative flex-shrink-0">
                        {isGroup ? (
                            groupPictureUrl ? (
                                <img
                                    src={groupPictureUrl}
                                    alt="Group"
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <UserGroupIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                            )
                        ) : (
                            participants.length > 0 && (
                                <img
                                    src={participants[0]?.avatar || '/avatar-placeholder.jpg'}
                                    alt={participants[0]?.name || 'User'}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            )
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
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
                                                    {renderMessageContent(message)}
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
                            {uploadedFilePreview ? (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg mr-3 flex-shrink-0 overflow-hidden">
                                    <img
                                        src={uploadedFilePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-green-100 rounded-lg mr-3 flex items-center justify-center flex-shrink-0">
                                    {getFileIcon(uploadedFile.type).icon}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-700 truncate block">{uploadedFile.name}</span>
                                <span className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)} - Ready to send</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleCancelUpload}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSendFileMessage}
                                    className="ml-2 px-3 py-1.5 bg-green-500 text-white text-sm rounded-md shadow-sm hover:bg-green-600"
                                >
                                    Send
                                </button>
                            </div>
                        </div>

                        {/* Optional text message with file */}
                        <div className="mt-3">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Add a message... (optional)"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Error message */}
                {fileError && (
                    <div className="px-6 py-3 bg-red-50 border-t border-red-100">
                        <div className="flex items-center text-red-600">
                            <span className="text-sm">{fileError}</span>
                            <button
                                onClick={() => setFileError(null)}
                                className="ml-auto p-1 rounded-full hover:bg-red-100"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'messages' && !uploading && !uploadedFile && !fileError && (
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
                                onClick={handleBrowseClick}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>
                            <motion.button
                                type="submit"
                                className="bg-green-500 p-2.5 rounded-full text-white shadow-md"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={!messageInput.trim()}
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