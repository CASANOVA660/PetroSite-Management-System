import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { PaperAirplaneIcon, Cog6ToothIcon, ArrowLeftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
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

interface ChatWindowProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isTyping?: boolean;
    typingUser?: string;
}

type ChatMode = 'messages' | 'participants';

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    onSendMessage,
    isTyping,
    typingUser,
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [mode, setMode] = useState<ChatMode>('messages');
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const filledMessages = [
        ...messages,
        ...Array.from({ length: 20 }, (_, i) => ({
            id: `filler-${i}`,
            sender: i % 2 === 0 ? 'Evan Scott' : 'You',
            content: i % 2 === 0 ? `This is a filler message #${i + 1}` : `Another message from you #${i + 1}`,
            timestamp: `11:${30 + i} AM`,
            isCurrentUser: i % 2 !== 0,
            avatar: i % 2 === 0 ? '/evan-avatar.jpg' : '/user-avatar.jpg',
        }))
    ];

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
                    <span className="text-lg font-semibold text-gray-800 truncate">Group Chat</span>
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
                    >
                        <AnimatePresence>
                            {filledMessages.map((message) => (
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
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center space-x-2 text-sm text-gray-500 pl-6"
                            >
                                <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                                <span>{typingUser} is typing...</span>
                            </motion.div>
                        )}
                    </div>
                )}
                {mode === 'participants' && (
                    <motion.div
                        key="participants"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center justify-center text-gray-500 text-lg h-full"
                    >
                        Participants view (static placeholder)
                    </motion.div>
                )}
            </div>

            {uploading && (
                <div className="px-6 py-3 bg-white border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1">
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-1.5 bg-green-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>{Math.round(uploadProgress)}%</span>
                                <span>{uploadProgress === 100 ? 'Completed' : 'Uploading...'}</span>
                            </div>
                        </div>
                        <button
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                            onClick={() => setUploading(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            {uploadedFile && !uploading && (
                <div className="px-6 py-3 bg-white border-t border-gray-200 flex items-center">
                    <div className="flex-1 flex items-center bg-green-50 rounded-lg px-3 py-2">
                        <ArrowUpTrayIcon className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                        <span className="ml-auto text-green-500 text-xs">100% Completed</span>
                    </div>
                    <button
                        className="ml-2 p-2 rounded-full hover:bg-gray-100 text-green-500"
                        onClick={handleSendFileMessage}
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
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
    );
};