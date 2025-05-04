import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { LeftSidebar } from './LeftSidebar';
import { ChatWindow } from './ChatWindow';
import { RightSidebar } from './RightSidebar';
import { VerticalNav } from './VerticalNav';
import { ChevronRightIcon, ChevronLeftIcon, DocumentIcon, PhotoIcon, FilmIcon, LinkIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState, useAppDispatch } from '../../store';
import { fetchChats, fetchChatById, fetchMessages, sendMessage, markChatAsRead, setSelectedChat, fetchUserByAccountId } from '../../store/slices/chatSlice';
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

    // Fetch user details for any accounts that don't have associated user data
    useEffect(() => {
        if (chats && chats.length > 0) {
            // Collect all account IDs that need to be fetched
            const accountsToFetch = new Set<string>();

            chats.forEach(chat => {
                chat.participants.forEach(participant => {
                    const properties = Object.keys(participant);
                    // If there's an _id and email but no utilisateurAssocie, we need to fetch the user
                    if (participant._id &&
                        !properties.includes('utilisateurAssocie') &&
                        !properties.includes('nom') &&
                        !properties.includes('prenom')) {
                        accountsToFetch.add(participant._id);
                    }
                });
            });

            // Fetch user details for each account
            accountsToFetch.forEach(accountId => {
                console.log("Fetching user details for account:", accountId);
                dispatch(fetchUserByAccountId(accountId))
                    .unwrap()
                    .then(response => {
                        console.log("Successfully fetched user details:", response);
                    })
                    .catch(error => {
                        console.log("Failed to fetch user details:", error);
                    });
            });
        }
    }, [chats, dispatch]);

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
    const formattedChats = chats.map(chat => {
        // Get the other participant's name for direct messages
        let chatName = '';
        let chatAvatar = '';

        if (chat.isGroup) {
            // For group chats, use the group title without any tag
            chatName = chat.title || 'Unnamed Group';
            chatAvatar = '/group-avatar.jpg';
        } else {
            // For direct messages, find the other participant
            const otherParticipant = chat.participants.find(p => p._id !== user?._id);

            if (otherParticipant) {
                // Check if we need to use utilisateurAssocie field
                const properties = Object.keys(otherParticipant);

                // Check for utilisateurAssocie field which points to the actual user data
                if (properties.includes('utilisateurAssocie') && (otherParticipant as any).utilisateurAssocie) {
                    const associatedUser = (otherParticipant as any).utilisateurAssocie;

                    if (typeof associatedUser === 'object') {
                        // If utilisateurAssocie is an expanded object with user details
                        if (associatedUser.nom && associatedUser.prenom) {
                            chatName = `${associatedUser.nom} ${associatedUser.prenom}`;
                        } else {
                            // Try other properties on the associated user
                            const userProps = Object.keys(associatedUser);
                            if (userProps.includes('name')) {
                                chatName = associatedUser.name;
                            } else {
                                chatName = "User";
                            }
                        }
                    } else {
                        // If utilisateurAssocie is just an ID, use email
                        chatName = (otherParticipant as any).email || "User";
                    }

                    chatAvatar = (otherParticipant as any).profilePicture || '/avatar-placeholder.jpg';
                } else if (properties.includes('nom') && properties.includes('prenom')) {
                    // Handle backend format with nom and prenom fields
                    chatName = `${(otherParticipant as any).nom} ${(otherParticipant as any).prenom}`;
                } else if (properties.includes('firstname') && properties.includes('lastname')) {
                    // Handle alternative format with firstname and lastname fields
                    chatName = `${(otherParticipant as any).firstname} ${(otherParticipant as any).lastname}`;
                } else if (properties.includes('name')) {
                    // Fallback to name field if nom/prenom not available
                    chatName = otherParticipant.name;
                } else if (properties.includes('email')) {
                    // Use email as name if no other name is available - this is the most common case for direct participants
                    chatName = (otherParticipant as any).email.split('@')[0] || "User";
                } else if (properties.length > 0) {
                    // Last resort: Use any property that might contain the name
                    const nameProps = ['displayName', 'username'];
                    for (const prop of nameProps) {
                        if (properties.includes(prop) && (otherParticipant as any)[prop]) {
                            chatName = (otherParticipant as any)[prop];
                            break;
                        }
                    }

                    // If still no name, use the first available property
                    if (!chatName && properties.length > 0) {
                        const firstProp = properties[0];
                        chatName = String((otherParticipant as any)[firstProp]) || 'User';
                    }
                } else {
                    chatName = 'User';
                }

                chatAvatar = otherParticipant.profilePicture || '/avatar-placeholder.jpg';
            } else {
                // Fallback name without tag
                chatName = 'Chat';
                chatAvatar = '/avatar-placeholder.jpg';
            }
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
        // Use the same name detection logic for message sender
        let senderName = '';
        const sender = msg.sender;

        if (!sender) {
            senderName = 'Unknown';
        } else {
            const properties = Object.keys(sender);

            // Check for utilisateurAssocie field which points to the actual user data
            if (properties.includes('utilisateurAssocie') && (sender as any).utilisateurAssocie) {
                const associatedUser = (sender as any).utilisateurAssocie;

                if (typeof associatedUser === 'object') {
                    // If utilisateurAssocie is an expanded object with user details
                    if (associatedUser.nom && associatedUser.prenom) {
                        senderName = `${associatedUser.nom} ${associatedUser.prenom}`;
                    } else {
                        // Try other properties on the associated user
                        const userProps = Object.keys(associatedUser);
                        if (userProps.includes('name')) {
                            senderName = associatedUser.name;
                        } else if (userProps.includes('email')) {
                            senderName = associatedUser.email;
                        } else {
                            senderName = "User";
                        }
                    }
                } else {
                    // If utilisateurAssocie is just an ID, use other fields
                    senderName = (sender as any).email || "User";
                }
            } else if (properties.includes('nom') && properties.includes('prenom')) {
                senderName = `${(sender as any).nom} ${(sender as any).prenom}`;
            } else if (properties.includes('firstname') && properties.includes('lastname')) {
                senderName = `${(sender as any).firstname} ${(sender as any).lastname}`;
            } else if (properties.includes('name')) {
                senderName = sender.name;
            } else if (properties.includes('email')) {
                // Use email username as name if no other name is available
                senderName = (sender as any).email.split('@')[0] || "User";
            } else if (properties.length > 0) {
                // Try any property that might contain the name
                const nameProps = ['displayName', 'username'];
                for (const prop of nameProps) {
                    if (properties.includes(prop) && (sender as any)[prop]) {
                        senderName = (sender as any)[prop];
                        break;
                    }
                }

                // If still no name, use the first available property
                if (!senderName && properties.length > 0) {
                    const firstProp = properties[0];
                    senderName = String((sender as any)[firstProp]) || 'User';
                }
            } else {
                senderName = 'User';
            }
        }

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
                                    groupName={selectedChat.isGroup ? selectedChat.title || '' : ''}
                                    memberCount={selectedChat.participants.length}
                                    groupAvatar="/group-avatar.jpg"
                                    members={selectedChat.participants.map(p => {
                                        // Check if we need to use utilisateurAssocie field
                                        const properties = Object.keys(p);
                                        let displayName = '';

                                        // Check for utilisateurAssocie field which points to the actual user data
                                        if (properties.includes('utilisateurAssocie') && (p as any).utilisateurAssocie) {
                                            const associatedUser = (p as any).utilisateurAssocie;

                                            if (typeof associatedUser === 'object') {
                                                // If utilisateurAssocie is an expanded object with user details
                                                if (associatedUser.nom && associatedUser.prenom) {
                                                    displayName = `${associatedUser.nom} ${associatedUser.prenom}`;
                                                } else {
                                                    // Try other properties on the associated user
                                                    const userProps = Object.keys(associatedUser);
                                                    if (userProps.includes('name')) {
                                                        displayName = associatedUser.name;
                                                    } else if (userProps.includes('email')) {
                                                        displayName = associatedUser.email;
                                                    } else {
                                                        displayName = "User";
                                                    }
                                                }
                                            } else {
                                                // If utilisateurAssocie is just an ID, use other fields
                                                displayName = (p as any).email || "User";
                                            }
                                        } else if (properties.includes('nom') && properties.includes('prenom')) {
                                            // Handle backend format with nom and prenom fields
                                            displayName = `${(p as any).nom} ${(p as any).prenom}`;
                                        } else if (properties.includes('firstname') && properties.includes('lastname')) {
                                            // Handle alternative format with firstname and lastname fields
                                            displayName = `${(p as any).firstname} ${(p as any).lastname}`;
                                        } else if (properties.includes('name')) {
                                            // Fallback to name field if nom/prenom not available
                                            displayName = p.name;
                                        } else if (properties.includes('email')) {
                                            // Use email as name if no other name is available
                                            displayName = (p as any).email.split('@')[0] || "User";
                                        } else if (properties.length > 0) {
                                            // Try any property that might contain the name
                                            const nameProps = ['displayName', 'username'];
                                            for (const prop of nameProps) {
                                                if (properties.includes(prop) && (p as any)[prop]) {
                                                    displayName = (p as any)[prop];
                                                    break;
                                                }
                                            }

                                            // If still no name, use the first available property
                                            if (!displayName && properties.length > 0) {
                                                const firstProp = properties[0];
                                                displayName = String((p as any)[firstProp]) || 'User';
                                            }
                                        } else {
                                            displayName = 'User';
                                        }

                                        return {
                                            id: p._id,
                                            name: displayName,
                                            avatar: p.profilePicture || '/user-avatar.jpg',
                                            isAdmin: p._id === selectedChat.admin?._id
                                        };
                                    })}
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