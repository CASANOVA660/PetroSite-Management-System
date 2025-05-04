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
import { getUserById } from '../../store/slices/userSlice';
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
    const [userDetailsMap, setUserDetailsMap] = useState<Record<string, any>>({});

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

    // Fetch user details for any accounts that don't have associated user data
    useEffect(() => {
        if (chats && chats.length > 0) {
            console.log('All chats data:', chats);

            // Collect all account IDs that need to be fetched
            const accountsToFetch = new Set<string>();

            chats.forEach(chat => {
                chat.participants.forEach(participant => {
                    // Always fetch user details for each participant to ensure we have the most up-to-date information
                    if (participant._id && participant._id !== user?._id) {
                        accountsToFetch.add(participant._id);

                        // If we have a reference to utilisateurAssocie as a string, fetch that user too
                        if ((participant as any).utilisateurAssocie && typeof (participant as any).utilisateurAssocie === 'string') {
                            accountsToFetch.add((participant as any).utilisateurAssocie);
                        }
                    }
                });
            });

            console.log('Accounts to fetch:', [...accountsToFetch]);

            // Fetch user details for each account and store them in a map
            const fetchPromises: Promise<any>[] = [];

            accountsToFetch.forEach(accountId => {
                const promise = dispatch(getUserById(accountId))
                    .unwrap()
                    .then(response => {
                        console.log(`User details fetched for ${accountId}:`, response);

                        // Store user details in the map
                        setUserDetailsMap(prev => ({
                            ...prev,
                            [accountId]: response
                        }));

                        return response;
                    })
                    .catch(error => {
                        console.error(`Failed to fetch user details for ${accountId}:`, error);
                        return null;
                    });

                fetchPromises.push(promise);
            });

            // Wait for all promises to complete
            Promise.all(fetchPromises).then(() => {
                console.log('All user details fetched');

                // Force a re-render after fetching all user details
                setUserDetailsMap(prevMap => ({ ...prevMap }));
            });
        }
    }, [chats, dispatch, user?._id]);

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

    // Get participant name without using email
    const getParticipantName = (participant: any): string => {
        if (!participant) return 'Unknown';

        console.log('Getting name for participant:', participant);

        // First check if we have this user in our userDetailsMap
        if (participant._id && userDetailsMap[participant._id]) {
            const userData = userDetailsMap[participant._id];
            console.log('Found user details in map:', userData);

            if (userData.nom && userData.prenom) {
                return `${userData.nom} ${userData.prenom}`;
            }

            if (userData.firstname && userData.lastname) {
                return `${userData.firstname} ${userData.lastname}`;
            }

            if (userData.name) {
                return userData.name;
            }
        }

        // If we don't have the user details, fetch them
        if (participant._id && !userDetailsMap[participant._id]) {
            console.log('Fetching user details for:', participant._id);
            dispatch(getUserById(participant._id))
                .unwrap()
                .then(response => {
                    console.log('User details fetched:', response);
                    setUserDetailsMap(prev => ({
                        ...prev,
                        [participant._id]: response
                    }));
                })
                .catch(error => {
                    console.error('Failed to fetch user details:', error);
                });
        }

        // Check direct properties
        if ((participant as any).nom && (participant as any).prenom) {
            return `${(participant as any).nom} ${(participant as any).prenom}`;
        }

        if ((participant as any).firstname && (participant as any).lastname) {
            return `${(participant as any).firstname} ${(participant as any).lastname}`;
        }

        if (participant.name) {
            return participant.name;
        }

        // Try to get name from email without showing email
        if ((participant as any).email) {
            const emailName = (participant as any).email.split('@')[0];
            // Capitalize first letter and replace dots/underscores with spaces
            return emailName
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .replace(/^(.)/, (match: string) => match.toUpperCase());
        }

        // Get name from _id as last resort
        if (participant._id) {
            return `User ${participant._id.substring(0, 8)}`;
        }

        return 'Unknown User';
    };

    // Format chats for the LeftSidebar component
    const formattedChats = chats.map(chat => {
        // Get the other participant's name for direct messages
        let chatName = '';
        let chatAvatar = '';

        console.log('Formatting chat:', chat);

        if (chat.isGroup) {
            // For group chats, use the group title
            chatName = chat.title || 'Unnamed Group';
            chatAvatar = '/group-avatar.jpg';
        } else {
            // For direct messages, find the other participant
            const otherParticipant = chat.participants.find(p => p._id !== user?._id);

            if (otherParticipant) {
                chatName = getParticipantName(otherParticipant);
                chatAvatar = otherParticipant.profilePicture || '/avatar-placeholder.jpg';
            } else {
                chatName = 'Chat';
                chatAvatar = '/avatar-placeholder.jpg';
            }

            console.log('Chat name determined:', chatName);
        }

        return {
            id: chat._id,
            name: chatName,
            lastMessage: chat.lastMessage?.content || 'No messages yet',
            time: chat.lastMessage
                ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
            avatar: chatAvatar,
            unreadCount: chat.unreadCount,
            isTyping: typing[chat._id]?.length > 0,
            isGroup: chat.isGroup
        };
    });

    // Format messages for the ChatWindow component
    const activeMessages = selectedChat && messages[selectedChat._id]?.data.map(msg => {
        // Get sender name
        const senderName = getParticipantName(msg.sender);

        return {
            id: msg._id,
            sender: senderName,
            content: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCurrentUser: msg.sender._id === user?._id,
            avatar: msg.sender._id === user?._id ? '/user-avatar.jpg' : '/evan-avatar.jpg',
            // Add attachments if available
            fileUrl: msg.attachments?.length ? msg.attachments[0].url : undefined,
            fileName: msg.attachments?.length ? msg.attachments[0].filename : undefined
        };
    }) || [];

    // Get typing status
    const isTyping = selectedChat ? typing[selectedChat._id]?.length > 0 : false;
    const typingUsers = selectedChat && isTyping
        ? chats.find(c => c._id === selectedChat._id)?.participants
            .filter(p => typing[selectedChat._id]?.includes(p._id))
            .map(p => getParticipantName(p))
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
                            participants={selectedChat.participants.map(p => {
                                return {
                                    id: p._id,
                                    name: getParticipantName(p),
                                    avatar: p.profilePicture || '/user-avatar.jpg',
                                    isAdmin: p._id === selectedChat.admin?._id,
                                    email: '' // Removing email display as requested
                                };
                            })}
                            isGroup={selectedChat.isGroup}
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
                                    groupName={selectedChat.isGroup ? selectedChat.title || '' : ''}
                                    memberCount={selectedChat.participants.length}
                                    groupAvatar="/group-avatar.jpg"
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