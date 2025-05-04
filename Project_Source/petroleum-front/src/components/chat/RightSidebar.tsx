import { motion } from 'framer-motion';
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
    XMarkIcon
} from '@heroicons/react/24/outline';

interface FileStats {
    totalFiles: number;
    totalLinks: number;
    categories: {
        documents: { count: number; size: string };
        photos: { count: number; size: string };
        movies: { count: number; size: string };
        other: { count: number; size: string };
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

export const RightSidebar: React.FC<RightSidebarProps> = ({
    groupName,
    memberCount,
    groupAvatar,
    fileStats,
    isGroup = false,
    onClose,
}) => {
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

    return (
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
                    {isGroup ? 'Group Info' : 'Chat Info'}
                </h2>
                <div className="flex items-center space-x-2">
                    <button
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Mute conversation"
                    >
                        <BellIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Chat/Group Info */}
            <div className="px-4 sm:px-6 py-6 border-b border-gray-100">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <img
                            src={groupAvatar}
                            alt={groupName || 'Chat'}
                            className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-white"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{groupName || 'Chat'}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {isGroup ? `${memberCount} members` : 'Direct Message'}
                    </p>

                    {/* Member count info */}
                    {isGroup && (
                        <div className="mt-6 w-full">
                            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                        <span className="text-xs font-medium text-gray-600">{memberCount}</span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-800">Members</p>
                                        <p className="text-xs text-gray-500">View in participants tab</p>
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
                <h4 className="text-sm font-medium text-gray-700 mb-3">Shared Files</h4>
            </div>
            <div className="px-3 sm:px-5 pb-3 sm:pb-5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-teal-50 rounded-xl p-2.5 sm:p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <DocumentIcon className="w-5 h-5 text-teal-500" />
                            <div className="ml-1.5 sm:ml-2.5">
                                <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.totalFiles}</p>
                                <p className="text-xs text-gray-500">All files</p>
                            </div>
                        </div>
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 sm:p-4 flex items-center">
                        <div className="flex items-center">
                            <LinkIcon className="w-5 h-5 text-slate-400" />
                            <div className="ml-1.5 sm:ml-2.5">
                                <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.totalLinks}</p>
                                <p className="text-xs text-gray-500">All links</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Categories - always shown */}
            <div className="px-3 sm:px-5 flex-1 overflow-y-auto">
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">File type</h4>
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Documents */}
                    <div className="bg-violet-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                <DocumentIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-violet-600" />
                            </div>
                            <div className="ml-2 sm:ml-3">
                                <span className="text-sm font-medium text-gray-800">Documents</span>
                                <p className="text-xs text-gray-500">
                                    {stats.categories.documents.count} files, {stats.categories.documents.size}
                                </p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Photos */}
                    <div className="bg-amber-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <PhotographIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-600" />
                            </div>
                            <div className="ml-2 sm:ml-3">
                                <span className="text-sm font-medium text-gray-800">Photos</span>
                                <p className="text-xs text-gray-500">
                                    {stats.categories.photos.count} files, {stats.categories.photos.size}
                                </p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Movies */}
                    <div className="bg-cyan-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                <FilmIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-cyan-600" />
                            </div>
                            <div className="ml-2 sm:ml-3">
                                <span className="text-sm font-medium text-gray-800">Movies</span>
                                <p className="text-xs text-gray-500">
                                    {stats.categories.movies.count} files, {stats.categories.movies.size}
                                </p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Other */}
                    <div className="bg-rose-50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                <FolderIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-600" />
                            </div>
                            <div className="ml-2 sm:ml-3">
                                <span className="text-sm font-medium text-gray-800">Other</span>
                                <p className="text-xs text-gray-500">
                                    {stats.categories.other.count} files, {stats.categories.other.size}
                                </p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};