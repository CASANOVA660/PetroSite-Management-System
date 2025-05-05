import { motion, AnimatePresence } from 'framer-motion';
import {
    DocumentIcon,
    LinkIcon,
    PhotoIcon as PhotographIcon,
    FilmIcon,
    FolderIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
    BellIcon,
    MicrophoneIcon,
    VideoCameraIcon,
    XMarkIcon,
    UserGroupIcon,
    CameraIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { toggleChatMute } from '../../store/slices/chatSlice';

interface FileItem {
    id: string;
    name: string;
    url: string;
    size: string;
    date: string;
    type: 'document' | 'photo' | 'movie' | 'other';
    extension?: string;
    thumbnail?: string;
    messageId: string;
}

interface FileStats {
    totalFiles: number;
    totalLinks: number;
    categories: {
        documents: { count: number; size: string; files?: FileItem[] };
        photos: { count: number; size: string; files?: FileItem[] };
        movies: { count: number; size: string; files?: FileItem[] };
        other: { count: number; size: string; files?: FileItem[] };
    };
}

interface RightSidebarProps {
    groupName: string;
    memberCount: number;
    groupAvatar: string;
    fileStats?: FileStats;
    isGroup?: boolean;
    onClose?: () => void;
}

// Modal component for displaying files by type
const FileTypeModal = ({
    isOpen,
    onClose,
    fileType,
    files
}: {
    isOpen: boolean;
    onClose: () => void;
    fileType: string;
    files: FileItem[];
}) => {
    const getIconByType = (fileType: string) => {
        switch (fileType) {
            case 'documents':
                return <DocumentIcon className="w-6 h-6 text-violet-600" />;
            case 'photos':
                return <PhotographIcon className="w-6 h-6 text-amber-600" />;
            case 'movies':
                return <FilmIcon className="w-6 h-6 text-cyan-600" />;
            default:
                return <FolderIcon className="w-6 h-6 text-rose-600" />;
        }
    };

    const getColorByType = (fileType: string) => {
        switch (fileType) {
            case 'documents':
                return 'bg-violet-50 border-violet-200';
            case 'photos':
                return 'bg-amber-50 border-amber-200';
            case 'movies':
                return 'bg-cyan-50 border-cyan-200';
            default:
                return 'bg-rose-50 border-rose-200';
        }
    };

    const getFileIcon = (file: FileItem) => {
        if (file.type === 'photo' && file.thumbnail) {
            return (
                <div className="w-10 h-10 rounded-md overflow-hidden">
                    <img
                        src={file.thumbnail || file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            );
        } else if (file.type === 'movie' && file.thumbnail) {
            return (
                <div className="relative w-10 h-10 rounded-md overflow-hidden">
                    <img
                        src={file.thumbnail || file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <FilmIcon className="w-5 h-5 text-white" />
                    </div>
                </div>
            );
        } else {
            return (
                <div className={`w-10 h-10 rounded-md ${file.type === 'document' ? 'bg-violet-100' : file.type === 'photo' ? 'bg-amber-100' : file.type === 'movie' ? 'bg-cyan-100' : 'bg-rose-100'} flex items-center justify-center`}>
                    {file.extension ? (
                        <span className="text-xs font-medium uppercase">{file.extension}</span>
                    ) : (
                        file.type === 'document' ? <DocumentIcon className="w-5 h-5 text-violet-600" /> :
                            file.type === 'photo' ? <PhotographIcon className="w-5 h-5 text-amber-600" /> :
                                file.type === 'movie' ? <FilmIcon className="w-5 h-5 text-cyan-600" /> :
                                    <FolderIcon className="w-5 h-5 text-rose-600" />
                    )}
                </div>
            );
        }
    };

    const handleDownload = (file: FileItem) => {
        console.log(`Téléchargement du fichier: ${file.name}`);

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTranslatedType = (fileType: string) => {
        switch (fileType) {
            case 'documents':
                return 'Documents';
            case 'photos':
                return 'Photos';
            case 'movies':
                return 'Vidéos';
            default:
                return 'Autres';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    {/* Backdrop with blur effect */}
                    <motion.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    >
                        {/* Header */}
                        <div className={`px-6 py-4 flex items-center justify-between border-b ${getColorByType(fileType)}`}>
                            <div className="flex items-center">
                                {getIconByType(fileType)}
                                <h3 className="text-lg font-semibold ml-2 text-gray-800">
                                    {getTranslatedType(fileType)}
                                </h3>
                                <span className="ml-2 px-2 py-0.5 bg-white/80 rounded-full text-xs text-gray-600">
                                    {files.length} fichiers
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-white/80 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* File List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {files.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                    <FolderIcon className="w-12 h-12 mb-2 text-gray-300" />
                                    <p>Aucun fichier trouvé dans cette catégorie</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {files.map((file) => (
                                        <motion.div
                                            key={file.id}
                                            className="bg-white border border-gray-100 rounded-lg p-3 flex items-center shadow-sm hover:shadow-md transition-shadow"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            {getFileIcon(file)}

                                            <div className="ml-3 flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-xs text-gray-500">{file.size}</span>
                                                    <span className="mx-1.5 w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="text-xs text-gray-500">{file.date}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                                aria-label="Télécharger le fichier"
                                            >
                                                <ArrowDownTrayIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
    groupName,
    memberCount,
    groupAvatar,
    fileStats,
    isGroup = false,
    onClose,
}) => {
    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const [modalType, setModalType] = useState<string | null>(null);
    const { selectedChat, messages, mutedChats } = useSelector((state: RootState) => state.chat);
    const dispatch = useDispatch();
    const [chatFiles, setChatFiles] = useState<{
        documents: FileItem[];
        photos: FileItem[];
        movies: FileItem[];
        other: FileItem[];
    }>({
        documents: [],
        photos: [],
        movies: [],
        other: []
    });

    // Default file stats if none provided
    const stats = fileStats || {
        totalFiles: 0,
        totalLinks: 0,
        categories: {
            documents: { count: 0, size: '0MB' },
            photos: { count: 0, size: '0MB' },
            movies: { count: 0, size: '0MB' },
            other: { count: 0, size: '0MB' },
        }
    };

    // Check if the current chat is muted
    const isMuted = selectedChat ? mutedChats.includes(selectedChat._id) : false;

    // Handle toggling mute state for the current chat
    const handleToggleMute = () => {
        if (selectedChat) {
            dispatch(toggleChatMute(selectedChat._id));
        }
    };

    const openModal = (type: string) => {
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
    };

    const getFiles = (type: string): FileItem[] => {
        if (type === 'documents') return chatFiles.documents;
        if (type === 'photos') return chatFiles.photos;
        if (type === 'movies') return chatFiles.movies;
        if (type === 'other') return chatFiles.other;
        return [];
    };

    // Parse file extensions to get a more user-friendly display
    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop()?.toUpperCase() || '';
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Extract files from messages when selectedChat changes
    useEffect(() => {
        if (selectedChat && messages[selectedChat._id]?.data) {
            const documents: FileItem[] = [];
            const photos: FileItem[] = [];
            const movies: FileItem[] = [];
            const other: FileItem[] = [];

            messages[selectedChat._id].data.forEach(message => {
                if (message.attachments?.length) {
                    message.attachments.forEach(attachment => {
                        const { url, filename, type, size } = attachment;
                        const fileSize = size ? (
                            size < 1024 ? `${size} o` :
                                size < 1048576 ? `${(size / 1024).toFixed(1)} Ko` :
                                    size < 1073741824 ? `${(size / 1048576).toFixed(1)} Mo` :
                                        `${(size / 1073741824).toFixed(1)} Go`
                        ) : 'Taille inconnue';

                        const extension = getFileExtension(filename);
                        const fileItem: FileItem = {
                            id: `${message._id}-${filename}`,
                            name: filename,
                            url,
                            size: fileSize,
                            date: formatDate(message.createdAt),
                            extension,
                            messageId: message._id,
                            thumbnail: type === 'image' || type === 'video' ? url : undefined,
                            type: type === 'image' ? 'photo' :
                                type === 'video' ? 'movie' :
                                    type === 'document' ? 'document' : 'other'
                        };

                        if (type === 'image') {
                            photos.push(fileItem);
                        } else if (type === 'video') {
                            movies.push(fileItem);
                        } else if (type === 'document') {
                            documents.push(fileItem);
                        } else {
                            other.push(fileItem);
                        }
                    });
                }
            });

            setChatFiles({
                documents,
                photos,
                movies,
                other
            });
        }
    }, [selectedChat, messages]);

    return (
        <>
            <motion.aside
                className="w-full h-full bg-white flex flex-col overflow-hidden"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Header */}
                <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-medium text-gray-800">
                        {isGroup ? 'Info du Groupe' : 'Info de la Discussion'}
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            className={`p-1.5 rounded-full transition-colors ${isMuted
                                ? "bg-red-100 text-red-500 hover:bg-red-200"
                                : "hover:bg-gray-100 text-gray-500"
                                }`}
                            onClick={handleToggleMute}
                            aria-label={isMuted ? "Activer les notifications" : "Désactiver les notifications"}
                            title={isMuted ? "Activer les notifications" : "Désactiver les notifications"}
                        >
                            <div className="relative">
                                <BellIcon className={`w-5 h-5 ${isMuted ? "text-red-500" : "text-gray-500"}`} />
                                {isMuted && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                                )}
                            </div>
                        </button>
                        <button
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={onClose}
                            aria-label="Fermer le panneau"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Chat/Group Info */}
                <div className="px-4 sm:px-6 py-6 border-b border-gray-100">
                    <div className="flex flex-col items-center">
                        <div
                            className="relative cursor-pointer group"
                            onMouseEnter={() => setIsHoveringImage(true)}
                            onMouseLeave={() => setIsHoveringImage(false)}
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-white relative">
                                {groupAvatar && groupAvatar !== '/group-avatar.jpg' ? (
                                    <img
                                        src={groupAvatar}
                                        alt={groupName || 'Discussion'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
                                        <UserGroupIcon className="w-12 h-12 text-indigo-400" />
                                    </div>
                                )}

                                {/* Hover overlay effect */}
                                <motion.div
                                    className="absolute inset-0 bg-black/30 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isHoveringImage ? 1 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isGroup && (
                                        <CameraIcon className="w-8 h-8 text-white" />
                                    )}
                                </motion.div>
                            </div>

                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-gray-900">{groupName || 'Discussion'}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {isGroup ? `${memberCount} membres` : 'Message Direct'}
                        </p>

                        {/* Action buttons */}
                        <div className="mt-5 flex items-center space-x-3">
                            <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                <MicrophoneIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                <VideoCameraIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Member count info */}
                        {isGroup && (
                            <div className="mt-6 w-full">
                                <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl hover:shadow-sm transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center">
                                        <div className="w-9 h-9 bg-indigo-200 rounded-lg flex items-center justify-center overflow-hidden">
                                            <UserGroupIcon className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-800">Membres ({memberCount})</p>
                                            <p className="text-xs text-gray-500">Voir tous les participants</p>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards - always show file stats */}
                <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Fichiers Partagés</h4>
                </div>
                <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-teal-50 rounded-xl p-2.5 sm:p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <DocumentIcon className="w-5 h-5 text-teal-500" />
                                <div className="ml-1.5 sm:ml-2.5">
                                    <p className="text-lg sm:text-xl font-bold text-gray-800">
                                        {chatFiles.documents.length + chatFiles.photos.length + chatFiles.movies.length + chatFiles.other.length}
                                    </p>
                                    <p className="text-xs text-gray-500">Tous les fichiers</p>
                                </div>
                            </div>
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5 sm:p-4 flex items-center">
                            <div className="flex items-center">
                                <LinkIcon className="w-5 h-5 text-slate-400" />
                                <div className="ml-1.5 sm:ml-2.5">
                                    <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.totalLinks}</p>
                                    <p className="text-xs text-gray-500">Tous les liens</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Categories - always shown */}
                <div className="px-3 sm:px-5 flex-1 overflow-y-auto">
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Type de fichier</h4>
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* Documents */}
                        <motion.div
                            className="bg-violet-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3 cursor-pointer hover:bg-violet-100 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openModal('documents')}
                        >
                            <div className="flex items-center">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                    <DocumentIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-violet-600" />
                                </div>
                                <div className="ml-2 sm:ml-3">
                                    <span className="text-sm font-medium text-gray-800">Documents</span>
                                    <p className="text-xs text-gray-500">
                                        {chatFiles.documents.length} fichiers, {stats.categories.documents.size}
                                    </p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </motion.div>

                        {/* Photos */}
                        <motion.div
                            className="bg-amber-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3 cursor-pointer hover:bg-amber-100 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openModal('photos')}
                        >
                            <div className="flex items-center">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <PhotographIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-600" />
                                </div>
                                <div className="ml-2 sm:ml-3">
                                    <span className="text-sm font-medium text-gray-800">Photos</span>
                                    <p className="text-xs text-gray-500">
                                        {chatFiles.photos.length} fichiers, {stats.categories.photos.size}
                                    </p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </motion.div>

                        {/* Movies */}
                        <motion.div
                            className="bg-cyan-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3 cursor-pointer hover:bg-cyan-100 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openModal('movies')}
                        >
                            <div className="flex items-center">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                    <FilmIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-cyan-600" />
                                </div>
                                <div className="ml-2 sm:ml-3">
                                    <span className="text-sm font-medium text-gray-800">Vidéos</span>
                                    <p className="text-xs text-gray-500">
                                        {chatFiles.movies.length} fichiers, {stats.categories.movies.size}
                                    </p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </motion.div>

                        {/* Other */}
                        <motion.div
                            className="bg-rose-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3 cursor-pointer hover:bg-rose-100 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openModal('other')}
                        >
                            <div className="flex items-center">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                    <FolderIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-600" />
                                </div>
                                <div className="ml-2 sm:ml-3">
                                    <span className="text-sm font-medium text-gray-800">Autres</span>
                                    <p className="text-xs text-gray-500">
                                        {chatFiles.other.length} fichiers, {stats.categories.other.size}
                                    </p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    </div>
                </div>
            </motion.aside>

            {/* File Type Modals */}
            {modalType && (
                <FileTypeModal
                    isOpen={!!modalType}
                    onClose={closeModal}
                    fileType={modalType}
                    files={getFiles(modalType)}
                />
            )}
        </>
    );
};