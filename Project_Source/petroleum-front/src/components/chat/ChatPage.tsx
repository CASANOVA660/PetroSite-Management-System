import { useState } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { ChatWindow } from './ChatWindow';
import { RightSidebar } from './RightSidebar';
import { VerticalNav } from './VerticalNav';
import { ChevronRightIcon, ChevronLeftIcon, DocumentIcon, PhotoIcon, FilmIcon, LinkIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from '../header/NotificationDropdown';

// Mock data for demonstration
const mockChats = [
    {
        id: '1',
        name: 'Real estate deals',
        lastMessage: 'What\'s in it for me?',
        time: '11:15',
        avatar: '/group-avatar.jpg',
        isTyping: false,
    },
    {
        id: '2',
        name: 'Kate Johnson',
        lastMessage: 'I will send the document s...',
        time: '11:15',
        avatar: '/kate-avatar.jpg',
    },
    {
        id: '3',
        name: 'Tamara Shevchenko',
        lastMessage: 'are you going to a busine...',
        time: '10:05',
        avatar: '/tamara-avatar.jpg',
    },
    {
        id: '4',
        name: 'Joshua Clarkson',
        lastMessage: 'I suggest to start, I have n...',
        time: '15:09',
        avatar: '/joshua-avatar.jpg',
    },
    {
        id: '5',
        name: 'Jeroen Zoet',
        lastMessage: 'We need to start a new re...',
        time: '14:09',
        avatar: '/jeroen-avatar.jpg',
    },
];

const mockMessages = [
    {
        id: '1',
        sender: 'Kate Johnson',
        content: 'What\'s in it for me? 🙂',
        timestamp: '11:35 AM',
        isCurrentUser: false,
        avatar: '/kate-avatar.jpg',
    },
    {
        id: '2',
        sender: 'Evan Scott',
        content: 'Robert, don\'t be like that and say something more 🙂',
        timestamp: '11:34 AM',
        isCurrentUser: false,
        avatar: '/evan-avatar.jpg',
    },
    {
        id: '3',
        sender: 'You',
        content: '😎 😁',
        timestamp: '',
        isCurrentUser: true,
        avatar: '/user-avatar.jpg',
    },
    {
        id: '4',
        sender: 'You',
        content: 'She creates an atmosphere of mystery 🙂',
        timestamp: '11:26 AM',
        isCurrentUser: true,
        avatar: '/user-avatar.jpg',
    },
    {
        id: '5',
        sender: 'Evan Scott',
        content: '@Kate ?',
        timestamp: '11:25 AM',
        isCurrentUser: false,
        avatar: '/evan-avatar.jpg',
    },
    {
        id: '6',
        sender: 'Evan Scott',
        content: 'Ooo, why don\'t you say something more',
        timestamp: '11:25 AM',
        isCurrentUser: false,
        avatar: '/evan-avatar.jpg',
    },
    {
        id: '7',
        sender: 'You',
        content: 'Here\'s the docu 🙂',
        timestamp: '11:37 AM',
        isCurrentUser: true,
        avatar: '/user-avatar.jpg',
        fileUrl: '/new_document_2020b.pdf',
        fileName: 'new_document_2020b.pdf',
    },
];

const mockFileStats = {
    totalFiles: 232,
    totalLinks: 45,
    categories: {
        documents: { count: 127, size: '193MB' },
        photos: { count: 53, size: '321MB' },
        movies: { count: 3, size: '210MB' },
        other: { count: 49, size: '194MB' },
    },
};

const miniSidebarIcons = [
    { icon: DocumentIcon, color: 'bg-blue-100 text-blue-500' },
    { icon: PhotoIcon, color: 'bg-yellow-100 text-yellow-500' },
    { icon: FilmIcon, color: 'bg-purple-100 text-purple-500' },
    { icon: LinkIcon, color: 'bg-gray-100 text-gray-500' },
];

const RIGHT_SIDEBAR_WIDTH = 280;
const MINI_SIDEBAR_WIDTH = 64;

export const ChatPage: React.FC = () => {
    const [activeChatId, setActiveChatId] = useState<string>('1');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [rightOpen, setRightOpen] = useState(true);
    const [leftOpen, setLeftOpen] = useState(false); // for mobile left sidebar

    const handleSendMessage = (message: string) => {
        console.log('Sending message:', message);
    };

    return (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[290px] flex flex-row overflow-hidden bg-[#F4F6FA] transition-all duration-300">
            {/* Left Sidebar: desktop & mobile differences */}
            <div className="hidden md:block w-72 h-full overflow-hidden relative flex-shrink-0">
                <LeftSidebar
                    chats={mockChats}
                    onChatSelect={setActiveChatId}
                    activeChatId={activeChatId}
                />
            </div>

            {/* Mobile Left Sidebar Drawer - only appears on mobile */}
            <AnimatePresence>
                {leftOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 z-[100] md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLeftOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.div
                            className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[101] flex flex-col md:hidden"
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <button
                                className="absolute top-4 right-4 z-20 bg-white border border-gray-200 rounded-full shadow p-2"
                                onClick={() => setLeftOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <XMarkIcon className="w-6 h-6 text-gray-500" />
                            </button>
                            <LeftSidebar
                                chats={mockChats}
                                onChatSelect={(id) => {
                                    setActiveChatId(id);
                                    setLeftOpen(false); // Close drawer when selecting chat on mobile
                                }}
                                activeChatId={activeChatId}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Hamburger button for mobile */}
            <button
                className="fixed top-4 left-4 z-[99] bg-white border border-gray-200 rounded-full shadow p-2 md:hidden"
                onClick={() => setLeftOpen(true)}
                aria-label="Open sidebar"
            >
                <Bars3Icon className="w-6 h-6 text-gray-500" />
            </button>

            {/* Main Chat Content */}
            <div className="flex-1 flex h-full min-h-0 overflow-hidden">
                {/* Chat Window */}
                <motion.div
                    className="flex-1 min-h-0 flex flex-col overflow-hidden h-full"
                    animate={{
                        width: rightOpen ? 'auto' : `calc(100% - ${MINI_SIDEBAR_WIDTH}px)`
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <ChatWindow
                        messages={mockMessages}
                        onSendMessage={handleSendMessage}
                        isTyping={isTyping}
                        typingUser={typingUser}
                    />
                </motion.div>

                {/* Right Sidebar */}
                <motion.div
                    animate={{
                        width: rightOpen ? RIGHT_SIDEBAR_WIDTH : MINI_SIDEBAR_WIDTH
                    }}
                    className={`h-full flex-shrink-0 flex flex-col bg-white border-l border-gray-100 relative overflow-hidden transition-all duration-300
                        ${rightOpen ? 'md:relative md:w-auto md:max-w-[280px] fixed inset-0 z-50 md:static md:inset-auto md:z-auto' : ''}
                    `}
                    style={{
                        minWidth: MINI_SIDEBAR_WIDTH,
                        maxWidth: RIGHT_SIDEBAR_WIDTH,
                    }}
                >
                    {rightOpen ? (
                        <div className="w-full h-full">
                            <RightSidebar
                                groupName="Real estate deals"
                                memberCount={10}
                                groupAvatar="/group-avatar.jpg"
                                fileStats={mockFileStats}
                                onClose={() => setRightOpen(false)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col w-full h-full">
                            <div className="p-3 border-b border-gray-100 flex justify-center">
                                <button
                                    onClick={() => setRightOpen(true)}
                                    className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
                                    aria-label="Open sidebar"
                                >
                                    <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3 mt-4 w-full items-center hidden md:flex">
                                {miniSidebarIcons.map(({ icon: Icon, color }, idx) => (
                                    <div key={idx} className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};