import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { LeftSidebar } from './LeftSidebar';
import { ChatWindow } from './ChatWindow';
import { RightSidebar } from './RightSidebar';
import { VerticalNav } from './VerticalNav';
import { ChevronRightIcon, ChevronLeftIcon, DocumentIcon, PhotoIcon, FilmIcon, LinkIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState, useAppDispatch } from '../../store';
import { fetchChats, fetchChatById, fetchMessages, sendMessage, markChatAsRead, setSelectedChat } from '../../store/slices/chatSlice';
import { Chat } from '../../types/chat';
import socketService from '../../services/socketService';

// Constants for sidebar dimensions
const RIGHT_SIDEBAR_WIDTH = 280;
const MINI_SIDEBAR_WIDTH = 64;

// Icons for mini sidebar
const miniSidebarIcons = [
    { icon: DocumentIcon, color: 'bg-blue-100 text-blue-500' },
    { icon: PhotoIcon, color: 'bg-yellow-100 text-yellow-500' },
    { icon: FilmIcon, color: 'bg-purple-100 text-purple-500' },
    { icon: LinkIcon, color: 'bg-gray-100 text-gray-500' },
];

export const ChatPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { chats, selectedChat, messages, loading, typing } = useSelector((state: RootState) => state.chat);

    const [rightOpen, setRightOpen] = useState(true);
    const [leftOpen, setLeftOpen] = useState(false); // for mobile left sidebar

    // Connect socket when component mounts
    useEffect(() => {
        if (user?._id) {
            socketService.connect(user._id);
        }

        return () => {
            socketService.disconnect();
        };
    }, [user?._id]);

    // Fetch chats when component mounts
    useEffect(() => {
        dispatch(fetchChats());
    }, [dispatch]);

    // Handle chat selection
    const handleChatSelect = useCallback((chatId: string) => {
        // Find the selected chat in the chats array
        const chat = chats.find(c => c._id === chatId);

        if (chat) {
            dispatch(setSelectedChat(chat));
            dispatch(fetchMessages({ chatId }));
            dispatch(markChatAsRead(chatId));
        }

        // Close mobile sidebar if open
        if (leftOpen) {
            setLeftOpen(false);
        }
    }, [chats, dispatch, leftOpen]);

    // Handle sending a message
    const handleSendMessage = useCallback((content: string) => {
        if (selectedChat && content.trim()) {
            dispatch(sendMessage({
                chatId: selectedChat._id,
                content
            }));
        }
    }, [dispatch, selectedChat]);

    // Format chats for the LeftSidebar component
    const formattedChats = chats.map(chat => ({
        id: chat._id,
        name: chat.isGroup
            ? (chat.title || 'Group Chat')
            : (chat.participants.find(p => p._id !== user?._id)?.name || 'Chat'),
        lastMessage: chat.lastMessage?.content || 'No messages yet',
        time: chat.lastMessage
            ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
        avatar: '/group-avatar.jpg', // Default avatar - can be updated with user avatar when available
        unreadCount: chat.unreadCount,
        isTyping: typing[chat._id]?.length > 0
    }));

    // Format messages for the ChatWindow component
    const activeMessages = selectedChat && messages[selectedChat._id]?.data.map(msg => ({
        id: msg._id,
        sender: msg.sender.name,
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrentUser: msg.sender._id === user?._id,
        avatar: msg.sender._id === user?._id ? '/user-avatar.jpg' : '/evan-avatar.jpg',
        // Add attachments if available
        fileUrl: msg.attachments?.length ? msg.attachments[0].url : undefined,
        fileName: msg.attachments?.length ? msg.attachments[0].filename : undefined
    })) || [];

    // Get typing status
    const isTyping = selectedChat ? typing[selectedChat._id]?.length > 0 : false;
    const typingUsers = selectedChat && isTyping
        ? chats.find(c => c._id === selectedChat._id)?.participants
            .filter(p => typing[selectedChat._id]?.includes(p._id))
            .map(p => p.name)
        : [];
    const typingUser = typingUsers?.length ? typingUsers[0] : '';

    return (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[290px] flex flex-row overflow-hidden bg-[#F4F6FA] transition-all duration-300">
            {/* Left Sidebar: desktop & mobile differences */}
            <div className="hidden md:block w-72 h-full overflow-hidden relative flex-shrink-0">
                <LeftSidebar
                    chats={formattedChats}
                    onChatSelect={handleChatSelect}
                    activeChatId={selectedChat?._id || ''}
                    isLoading={loading.chats}
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
                                chats={formattedChats}
                                onChatSelect={handleChatSelect}
                                activeChatId={selectedChat?._id || ''}
                                isLoading={loading.chats}
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
                    {selectedChat ? (
                        <ChatWindow
                            messages={activeMessages}
                            onSendMessage={handleSendMessage}
                            isTyping={isTyping}
                            typingUser={typingUser}
                            isLoading={loading.messages}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-600">Welcome to Chat</h2>
                                <p className="text-gray-500 mt-2">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Right Sidebar */}
                {selectedChat && (
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
                                    groupName={selectedChat.title || 'Chat'}
                                    memberCount={selectedChat.participants.length}
                                    groupAvatar="/group-avatar.jpg"
                                    members={selectedChat.participants.map(p => ({
                                        id: p._id,
                                        name: p.name,
                                        avatar: p.profilePicture || '/user-avatar.jpg',
                                        isAdmin: p._id === selectedChat.admin._id
                                    }))}
                                    isGroup={selectedChat.isGroup}
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
                                        <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto py-4">
                                    <VerticalNav icons={miniSidebarIcons} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};