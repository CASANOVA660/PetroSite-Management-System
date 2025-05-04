import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon as SearchIcon, XMarkIcon, UserIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { createChat } from '../../store/slices/chatSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import toast from 'react-hot-toast';

interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    avatar: string;
    isTyping?: boolean;
    unreadCount?: number;
    isGroup?: boolean;
}

interface User {
    _id: string;
    nom: string;
    email: string;
    [key: string]: any; // Allow any additional properties
}

interface LeftSidebarProps {
    chats: Chat[];
    onChatSelect: (chatId: string) => void;
    activeChatId?: string;
    isLoading?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
    chats,
    onChatSelect,
    activeChatId,
    isLoading = false
}) => {
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { users = [], loading: usersLoading } = useSelector((state: RootState) => state.users || {});
    const { loading } = useSelector((state: RootState) => state.chat);

    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatPopup, setShowNewChatPopup] = useState(false);
    const [newChatType, setNewChatType] = useState<'direct' | 'group' | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Fetch users for the popup
    useEffect(() => {
        if (showNewChatPopup) {
            dispatch(fetchUsers());
        }
    }, [dispatch, showNewChatPopup]);

    // Safe filtering of chats
    const filteredChats = chats ? chats.filter((chat) => {
        try {
            if (!chat || !chat.name) return false;
            return chat.name.toLowerCase().includes((searchQuery || '').toLowerCase());
        } catch (error) {
            console.error("Error filtering chats:", error);
            return false;
        }
    }) : [];

    // Safe filtering of users
    const filteredUsers = (() => {
        try {
            if (!users || !Array.isArray(users)) return [];

            const query = (userSearchQuery || '').toLowerCase();

            return users.filter(u => {
                if (!u) return false;

                const name = u.nom ? `${u.nom} ${u.prenom || ''}`.toLowerCase() : '';
                const email = u.email ? u.email.toLowerCase() : '';

                return name.includes(query) || email.includes(query);
            });
        } catch (error) {
            console.error("Error filtering users:", error);
            return [];
        }
    })();

    const handleCreateChat = async () => {
        if (newChatType === 'direct' && selectedUsers.length === 1) {
            const selectedUser = users.find((u: User) => u?._id === selectedUsers[0]);
            const chatName = selectedUser ? `${selectedUser.nom || ''} ${selectedUser.prenom || ''}`.trim() : 'Direct Message';

            try {
                await dispatch(createChat({
                    participants: [selectedUsers[0]],
                    isGroup: false
                })).unwrap();

                toast.success(`Chat with ${chatName} created successfully`);
                closePopup();
            } catch (error) {
                toast.error('Failed to create chat. Please try again.');
            }
        } else if (newChatType === 'group' && selectedUsers.length > 0 && groupName) {
            try {
                await dispatch(createChat({
                    title: groupName,
                    participants: selectedUsers,
                    isGroup: true
                })).unwrap();

                toast.success(`Group "${groupName}" created successfully`);
                closePopup();
            } catch (error) {
                toast.error('Failed to create group chat. Please try again.');
            }
        }
    };

    const toggleUserSelection = (userId: string) => {
        if (!userId) return;

        if (newChatType === 'direct') {
            setSelectedUsers([userId]);
        } else {
            if (selectedUsers.includes(userId)) {
                setSelectedUsers(selectedUsers.filter(id => id !== userId));
            } else {
                setSelectedUsers([...selectedUsers, userId]);
            }
        }
    };

    const closePopup = () => {
        setShowNewChatPopup(false);
        setNewChatType(null);
        setSelectedUsers([]);
        setGroupName('');
        setUserSearchQuery('');
    };

    // Function to get appropriate avatar for the chat
    const getChatAvatar = (chat: Chat) => {
        if (!chat) return '/avatar-placeholder.jpg';

        if (chat.isGroup) {
            return '/group-avatar.jpg';
        }
        // For direct messages, use the other user's avatar or a default
        return chat.avatar || '/avatar-placeholder.jpg';
    };

    // Ensure we're clearly showing the participant we're chatting with
    const getChatDisplayName = (chat: Chat) => {
        if (!chat) return <span className="font-medium text-gray-900 text-sm">Unknown</span>;

        return (
            <div className="flex items-center">
                <span className="font-medium text-gray-900 text-sm">{chat.name || 'Chat'}</span>
            </div>
        );
    };

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
                        src={(user as any)?.profilePicture || "/avatar-placeholder.jpg"}
                        alt="User"
                        className="w-16 h-16 rounded-full ring-2 ring-green-200"
                    />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <h2 className="mt-3 font-semibold text-lg text-gray-900">
                    {(user as any)?.nom || ''} {(user as any)?.prenom || ''}
                </h2>
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
                    <button
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                        onClick={() => setShowNewChatPopup(true)}
                        disabled={loading?.operations}
                    >
                        {loading?.operations ? (
                            <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <PlusIcon className="w-4 h-4" />
                        )}
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
                {isLoading ? (
                    <div className="py-4 text-center text-gray-500">
                        Loading chats...
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="py-4 text-center text-gray-500">
                        No chats found
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <motion.div
                            key={chat.id}
                            className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-green-50' : 'hover:bg-gray-50'
                                }`}
                            whileHover={{ backgroundColor: '#f5f5f5' }}
                            onClick={() => chat.id && onChatSelect(chat.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <img
                                        src={getChatAvatar(chat)}
                                        alt={chat.name || 'Chat'}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    {chat.isTyping && (
                                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="flex space-x-0.5">
                                                <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
                                                <span className="w-1 h-1 bg-white rounded-full animate-bounce delay-100"></span>
                                                <span className="w-1 h-1 bg-white rounded-full animate-bounce delay-200"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {getChatDisplayName(chat)}
                                    {chat.isTyping ? (
                                        <p className="text-xs text-green-600 font-medium">
                                            Typing...
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-600 truncate max-w-[160px]">
                                            {chat.lastMessage || 'No messages yet'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-500">{chat.time || ''}</span>
                                {chat.unreadCount && chat.unreadCount > 0 && (
                                    <span className="mt-1 bg-green-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* New Chat Popup */}
            <AnimatePresence>
                {showNewChatPopup && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 z-[200]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePopup}
                        />

                        {/* Popup */}
                        <motion.div
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-[90%] max-w-md z-[201] overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {newChatType === null ? 'New Chat' :
                                        newChatType === 'direct' ? 'New Direct Message' : 'New Group Chat'}
                                </h3>
                                <button
                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                                    onClick={closePopup}
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                {newChatType === null ? (
                                    <div className="flex flex-col space-y-3">
                                        <button
                                            className="flex items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition"
                                            onClick={() => setNewChatType('direct')}
                                        >
                                            <UserIcon className="w-6 h-6 text-green-600 mr-3" />
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900">Direct Message</div>
                                                <div className="text-sm text-gray-600">Chat privately with another user</div>
                                            </div>
                                        </button>
                                        <button
                                            className="flex items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
                                            onClick={() => setNewChatType('group')}
                                        >
                                            <UserGroupIcon className="w-6 h-6 text-blue-600 mr-3" />
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900">Group Chat</div>
                                                <div className="text-sm text-gray-600">Create a chat with multiple participants</div>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col space-y-4">
                                        {newChatType === 'group' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Group Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter group name"
                                                    value={groupName}
                                                    onChange={(e) => setGroupName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {newChatType === 'direct' ? 'Select User' : 'Add Participants'}
                                            </label>
                                            <div className="relative mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Search users..."
                                                    value={userSearchQuery || ''}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                                />
                                                <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                            </div>

                                            {usersLoading ? (
                                                <div className="py-3 text-center text-sm text-gray-500">
                                                    Loading users...
                                                </div>
                                            ) : (
                                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                                                    {!filteredUsers || filteredUsers.length === 0 ? (
                                                        <div className="py-3 text-center text-sm text-gray-500">
                                                            No users found
                                                        </div>
                                                    ) : (
                                                        filteredUsers.map((user: User) => (
                                                            user ? (
                                                                <div
                                                                    key={user._id}
                                                                    className={`flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 ${selectedUsers.includes(user._id) ? 'bg-green-50' : ''
                                                                        }`}
                                                                    onClick={() => toggleUserSelection(user._id)}
                                                                >
                                                                    <div className="flex items-center">
                                                                        <img
                                                                            src={user.profilePicture || "/avatar-placeholder.jpg"}
                                                                            alt={user.nom || 'User'}
                                                                            className="w-8 h-8 rounded-full mr-2"
                                                                        />
                                                                        <div>
                                                                            <div className="text-sm font-medium">{user.nom || ''} {user.prenom || ''}</div>
                                                                            <div className="text-xs text-gray-500">{user.email || ''}</div>
                                                                        </div>
                                                                    </div>
                                                                    {selectedUsers.includes(user._id) && (
                                                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : null
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Users Pills (for group) */}
                                        {newChatType === 'group' && selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsers.map(userId => {
                                                    const user = users.find((u: User) => u && u._id === userId);
                                                    return user ? (
                                                        <div key={userId} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                                                            {user.nom || ''} {user.prenom || ''}
                                                            <button
                                                                className="ml-1 p-0.5 rounded-full hover:bg-green-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleUserSelection(userId);
                                                                }}
                                                            >
                                                                <XMarkIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {newChatType !== null && (
                                <div className="p-4 border-t border-gray-200 flex justify-between">
                                    <button
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                        onClick={() => newChatType === null ? closePopup() : setNewChatType(null)}
                                    >
                                        Back
                                    </button>
                                    <button
                                        className={`px-4 py-2 text-white rounded-md flex items-center gap-2 ${(newChatType === 'direct' && selectedUsers.length === 1) ||
                                            (newChatType === 'group' && selectedUsers.length > 0 && groupName)
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-gray-300 cursor-not-allowed'
                                            }`}
                                        onClick={handleCreateChat}
                                        disabled={
                                            loading?.operations ||
                                            !(newChatType === 'direct' && selectedUsers.length === 1) &&
                                            !(newChatType === 'group' && selectedUsers.length > 0 && groupName)
                                        }
                                    >
                                        {loading?.operations ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Chat'
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.aside>
    );
};