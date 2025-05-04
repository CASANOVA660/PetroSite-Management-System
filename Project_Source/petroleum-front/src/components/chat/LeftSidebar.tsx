import { motion } from 'framer-motion';
import { useState } from 'react';
import { MagnifyingGlassIcon as SearchIcon } from '@heroicons/react/24/outline';

interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    avatar: string;
    isTyping?: boolean;
}

interface LeftSidebarProps {
    chats: Chat[];
    onChatSelect: (chatId: string) => void;
    activeChatId?: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
    chats,
    onChatSelect,
    activeChatId,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.aside
            className="w-full h-full bg-white shadow-md flex flex-col overflow-hidden"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* User Profile Section */}
            <div className="px-6 pt-8 pb-4 flex flex-col items-center border-b border-gray-200">
                <div className="relative">
                    <img
                        src="/avatar-placeholder.jpg"
                        alt="User"
                        className="w-16 h-16 rounded-full ring-2 ring-green-200"
                    />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <h2 className="mt-3 font-semibold text-lg text-gray-900">Jontray Arnold</h2>
                <span className="mt-2 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full cursor-pointer">
                    Available
                </span>
            </div>

            {/* Search Bar Section */}
            <div className="px-6 py-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                    />
                    <SearchIcon className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                </div>
            </div>

            {/* Last Chats Header */}
            <div className="flex items-center justify-between px-6 py-2">
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Recent Chats
                </span>
                <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition">
                        <span className="text-xl leading-none">+</span>
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <circle cx="5" cy="12" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="19" cy="12" r="1.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4">
                {filteredChats.map((chat) => (
                    <motion.div
                        key={chat.id}
                        className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-green-50' : 'hover:bg-gray-50'
                            }`}
                        whileHover={{ backgroundColor: '#f5f5f5' }}
                        onClick={() => onChatSelect(chat.id)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <img
                                    src={chat.avatar}
                                    alt={chat.name}
                                    className="w-10 h-10 rounded-full"
                                />
                                {chat.isTyping && (
                                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{chat.name}</p>
                                <p className="text-xs text-gray-600 truncate max-w-[160px]">
                                    {chat.lastMessage}
                                </p>
                                {chat.isTyping && (
                                    <p className="text-xs text-green-600 italic">Typing...</p>
                                )}
                            </div>
                        </div>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                    </motion.div>
                ))}
            </div>
        </motion.aside>
    );
};