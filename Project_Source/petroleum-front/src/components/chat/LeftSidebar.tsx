import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon as SearchIcon, XMarkIcon, UserIcon, UserGroupIcon, PlusIcon, CameraIcon } from '@heroicons/react/24/outline';
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
    groupPicture?: {
        url: string;
        publicId: string;
    };
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
    const [groupImage, setGroupImage] = useState<File | null>(null);
    const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [creatingChat, setCreatingChat] = useState(false);

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
            const chatName = selectedUser ? `${selectedUser.nom || ''} ${selectedUser.prenom || ''}`.trim() : 'Message Direct';

            try {
                await dispatch(createChat({
                    participants: [selectedUsers[0]],
                    isGroup: false
                })).unwrap();

                toast.success(`Discussion avec ${chatName} créée avec succès`);
                closePopup();
            } catch (error) {
                toast.error('Échec de la création de la discussion. Veuillez réessayer.');
            }
        } else if (newChatType === 'group' && selectedUsers.length > 0 && groupName) {
            try {
                setCreatingChat(true);
                // Create FormData for the request
                const formData = new FormData();
                formData.append('title', groupName);
                formData.append('isGroup', 'true');

                // Add participants
                selectedUsers.forEach((userId, index) => {
                    formData.append(`participants[${index}]`, userId);
                });

                // Add group picture if one was selected
                if (groupImage) {
                    formData.append('groupPicture', groupImage);
                    console.log('Attaching group picture to request:', groupImage.name);
                }

                // Dispatch the action with the FormData
                await dispatch(createChat(formData)).unwrap();
                toast.success(`Groupe "${groupName}" créé avec succès`);
                closePopup();
            } catch (error: any) {
                console.error('Error creating group chat:', error);
                toast.error(error?.message || 'Échec de la création du groupe. Veuillez réessayer.');
            } finally {
                setCreatingChat(false);
            }
        }
    };

    const handleGroupImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if the file is an image
        if (!file.type.match('image.*')) {
            toast.error('Veuillez sélectionner un fichier image');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La taille de l\'image doit être inférieure à 5 Mo');
            return;
        }

        setGroupImage(file);

        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setGroupImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
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
        setGroupImage(null);
        setGroupImagePreview(null);
    };

    // Function to get appropriate avatar for the chat
    const getChatAvatar = (chat: Chat): string | null => {
        if (!chat) return null;

        if (chat.isGroup) {
            // First check if chat has a groupPicture property directly
            if (chat.groupPicture?.url) {
                return chat.groupPicture.url;
            }
            // Use avatar if available (this comes from formattedChats)
            if (chat.avatar && chat.avatar !== '/group-avatar.jpg') {
                return chat.avatar;
            }
            // Return null to indicate we should use a group icon
            return null;
        }
        // For direct messages, use the other user's avatar or null for user icon
        return chat.avatar && chat.avatar !== '/avatar-placeholder.jpg' ? chat.avatar : null;
    };

    // Ensure we're clearly showing the participant we're chatting with
    const getChatDisplayName = (chat: Chat) => {
        if (!chat) return <span className="font-medium text-gray-900 text-sm">Inconnu</span>;

        return (
            <div className="flex items-center">
                <span className="font-medium text-gray-900 text-sm">{chat.name || 'Discussion'}</span>
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
                    {(user as any)?.profilePicture?.url ? (
                        <img
                            src={(user as any).profilePicture.url}
                            alt="Utilisateur"
                            className="w-16 h-16 rounded-full ring-2 ring-green-200 object-cover"
                        />
                    ) : (
                        <img
                            src="/avatar-placeholder.jpg"
                            alt="Utilisateur"
                            className="w-16 h-16 rounded-full ring-2 ring-green-200"
                        />
                    )}
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <h2 className="mt-3 font-semibold text-lg text-gray-900">
                    {(user as any)?.nom || ''} {(user as any)?.prenom || ''}
                </h2>
                <span className="mt-2 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full cursor-pointer">
                    Disponible
                </span>
            </div>

            {/* Search Bar Section */}
            <div className="px-6 py-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Rechercher des discussions..."
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
                    Discussions Récentes
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
                        Chargement des discussions...
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="py-4 text-center text-gray-500">
                        Aucune discussion trouvée
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <motion.div
                            key={chat.id}
                            className={`flex items-center p-3 cursor-pointer 
                                ${activeChatId === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} 
                                transition-colors rounded-xl mb-1`}
                            onClick={() => onChatSelect(chat.id)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="relative flex-shrink-0">
                                {getChatAvatar(chat) !== null ? (
                                    <img
                                        src={getChatAvatar(chat) || ''}
                                        alt={chat.name}
                                        className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                    />
                                ) : chat.isGroup ? (
                                    // Group icon fallback
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                        <UserGroupIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                                    </div>
                                ) : (
                                    // User icon fallback
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                        <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${chat.unreadCount && chat.unreadCount > 0 ? 'bg-green-500 flex items-center justify-center text-xs text-white font-bold' : ''}`}>
                                    {chat.unreadCount && chat.unreadCount > 0 ? chat.unreadCount : null}
                                </span>
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {chat.name}
                                    </h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {chat.time}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                                        {chat.isTyping
                                            ? <span className="text-green-500 dark:text-green-400 flex items-center">
                                                <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                                En train d'écrire...
                                            </span>
                                            : chat.lastMessage
                                        }
                                    </p>
                                </div>
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePopup}
                        />

                        {/* Popup */}
                        <motion.div
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] max-w-md z-[201] overflow-hidden max-h-[90vh] flex flex-col"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                    {newChatType === null ? 'Nouvelle Conversation' :
                                        newChatType === 'direct' ? 'Nouveau Message Direct' : 'Nouveau Groupe de Discussion'}
                                </h3>
                                <button
                                    onClick={closePopup}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content - make scrollable */}
                            <div className="p-5 overflow-y-auto flex-grow">
                                {newChatType === null ? (
                                    <div className="flex flex-col space-y-4">
                                        <motion.button
                                            className="flex items-center p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 hover:shadow-md transition-all duration-300 group"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setNewChatType('direct')}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center mr-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                                                <UserIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900 dark:text-white">Direct Message</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Chat privately with another user</div>
                                            </div>
                                        </motion.button>
                                        <motion.button
                                            className="flex items-center p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:shadow-md transition-all duration-300 group"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setNewChatType('group')}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center mr-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                                                <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900 dark:text-white">Group Chat</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Create a chat with multiple participants</div>
                                            </div>
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col space-y-5">
                                        {newChatType === 'group' && (
                                            <>
                                                {/* Hidden file input */}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleGroupImageChange}
                                                />

                                                {/* Group Profile Picture */}
                                                <div className="flex flex-col items-center mb-2">
                                                    <div
                                                        className="relative group cursor-pointer"
                                                        onClick={triggerFileInput}
                                                    >
                                                        <div className={`
                                                            w-24 h-24 rounded-full flex items-center justify-center mb-2 overflow-hidden
                                                            ${groupImagePreview
                                                                ? 'border-2 border-indigo-400 shadow-md'
                                                                : 'bg-gray-200 dark:bg-gray-700'}
                                                        `}>
                                                            {groupImagePreview ? (
                                                                <img
                                                                    src={groupImagePreview}
                                                                    alt="Group preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <UserGroupIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-white dark:border-gray-800 cursor-pointer hover:bg-indigo-600 transition-colors">
                                                            <CameraIcon className="w-4 h-4 text-white" />
                                                        </div>

                                                        {/* Hover effect */}
                                                        <motion.div
                                                            className="absolute inset-0 w-24 h-24 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            initial={{ opacity: 0 }}
                                                            whileHover={{ opacity: 1 }}
                                                        >
                                                            <p className="text-white text-xs font-medium">
                                                                {groupImage ? 'Changer' : 'Ajouter'} Image
                                                            </p>
                                                        </motion.div>
                                                    </div>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2 flex items-center">
                                                        Image du Groupe
                                                        {groupImage && (
                                                            <span className="ml-1.5 text-xs text-white bg-green-500 py-0.5 px-1.5 rounded-full flex items-center">
                                                                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                </svg>
                                                                Sélectionnée
                                                            </span>
                                                        )}
                                                    </label>
                                                </div>
                                                {/* Group Name */}
                                                <div className="mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        Nom du Groupe
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Entrez le nom du groupe"
                                                        value={groupName}
                                                        onChange={(e) => setGroupName(e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-700 dark:text-white transition-all"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                {newChatType === 'direct' ? 'Sélectionnez un Utilisateur' : 'Ajouter des Participants'}
                                            </label>
                                            <div className="relative mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Rechercher des utilisateurs..."
                                                    value={userSearchQuery || ''}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                    className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-700 dark:text-white transition-all"
                                                />
                                                <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                            </div>

                                            {usersLoading ? (
                                                <div className="flex justify-center py-6">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                                </div>
                                            ) : (
                                                <div className="h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 custom-scrollbar">
                                                    {!filteredUsers || filteredUsers.length === 0 ? (
                                                        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            Aucun utilisateur trouvé
                                                        </div>
                                                    ) : (
                                                        filteredUsers.map((user: User) => (
                                                            user ? (
                                                                <motion.div
                                                                    key={user._id}
                                                                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedUsers.includes(user._id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                                                    onClick={() => toggleUserSelection(user._id)}
                                                                    whileHover={{ backgroundColor: selectedUsers.includes(user._id) ? "#EEF2FF" : "#F3F4F6" }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                >
                                                                    <div className="flex items-center">
                                                                        {/* Use proper profile picture handling */}
                                                                        {(user as any)?.profilePicture?.url ? (
                                                                            <img
                                                                                src={(user as any).profilePicture.url}
                                                                                alt={user.nom || 'Utilisateur'}
                                                                                className="w-10 h-10 rounded-full object-cover mr-3"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                                                                                <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-800 dark:text-white">{user.nom || ''} {user.prenom || ''}</div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email || ''}</div>
                                                                        </div>
                                                                    </div>
                                                                    {selectedUsers.includes(user._id) && (
                                                                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            ) : null
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Users Pills (for group) */}
                                        {newChatType === 'group' && selectedUsers.length > 0 && (
                                            <div className="mt-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Participants Sélectionnés ({selectedUsers.length})
                                                </label>
                                                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-20 overflow-y-auto custom-scrollbar">
                                                    {selectedUsers.map(userId => {
                                                        const user = users.find((u: User) => u && u._id === userId);
                                                        return user ? (
                                                            <div
                                                                key={userId}
                                                                className="flex items-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 pl-2 pr-1 py-1 rounded-full text-sm flex-shrink-0"
                                                            >
                                                                {/* Show mini profile picture */}
                                                                {(user as any)?.profilePicture?.url ? (
                                                                    <img
                                                                        src={(user as any).profilePicture.url}
                                                                        className="w-5 h-5 rounded-full object-cover mr-1"
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                                                                )}
                                                                <span className="truncate max-w-[80px]">
                                                                    {user.nom || ''} {user.prenom || ''}
                                                                </span>
                                                                <button
                                                                    className="ml-1 p-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 flex-shrink-0"
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
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {newChatType !== null && (
                                <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-between flex-shrink-0">
                                    <motion.button
                                        className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => newChatType === null ? closePopup() : setNewChatType(null)}
                                        disabled={creatingChat}
                                    >
                                        Retour
                                    </motion.button>
                                    <motion.button
                                        className={`px-5 py-2.5 text-white rounded-lg flex items-center gap-2 ${(newChatType === 'direct' && selectedUsers.length === 1) ||
                                            (newChatType === 'group' && selectedUsers.length > 0 && groupName)
                                            ? 'bg-indigo-500 hover:bg-indigo-600'
                                            : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                            }`}
                                        whileHover={
                                            !creatingChat && ((newChatType === 'direct' && selectedUsers.length === 1) ||
                                                (newChatType === 'group' && selectedUsers.length > 0 && groupName))
                                                ? { scale: 1.03 }
                                                : {}
                                        }
                                        whileTap={
                                            !creatingChat && ((newChatType === 'direct' && selectedUsers.length === 1) ||
                                                (newChatType === 'group' && selectedUsers.length > 0 && groupName))
                                                ? { scale: 0.98 }
                                                : {}
                                        }
                                        onClick={handleCreateChat}
                                        disabled={
                                            creatingChat ||
                                            loading?.operations ||
                                            !(newChatType === 'direct' && selectedUsers.length === 1) &&
                                            !(newChatType === 'group' && selectedUsers.length > 0 && groupName)
                                        }
                                    >
                                        {creatingChat || loading?.operations ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Création en cours...</span>
                                            </>
                                        ) : (
                                            <span>Créer Discussion</span>
                                        )}
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.aside>
    );
};