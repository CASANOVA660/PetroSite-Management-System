import { motion } from 'framer-motion';
import {
    DocumentIcon,
    LinkIcon,
    PhotoIcon as PhotographIcon,
    FilmIcon,
    FolderIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
    UserIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import AlertIcon from '../../icons/alert.svg';

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

interface Member {
    id: string;
    name: string;
    avatar: string;
    isAdmin: boolean;
}

interface RightSidebarProps {
    groupName: string;
    memberCount: number;
    groupAvatar: string;
    fileStats?: FileStats;
    members?: Member[];
    isGroup?: boolean;
    onClose?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
    groupName,
    memberCount,
    groupAvatar,
    fileStats,
    members = [],
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
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center">
                <button className="p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors" onClick={onClose}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 className="ml-3 text-base font-medium text-gray-800">
                    {isGroup ? 'Group Info' : 'Chat Info'}
                </h2>
            </div>

            {/* Group Info */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
                <img
                    src={groupAvatar}
                    alt={groupName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm"
                />
                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">{groupName}</h3>
                <p className="mt-1 text-sm text-gray-500">
                    {isGroup ? `${memberCount} members` : 'Direct Message'}
                </p>
            </div>

            {/* Members */}
            <div className="px-4 sm:px-6 py-2 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {isGroup ? 'Members' : 'Participants'}
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center">
                                <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-800">{member.name}</p>
                                    {member.isAdmin && (
                                        <span className="text-xs text-green-600">Admin</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Cards - only show if fileStats provided */}
            {fileStats && (
                <>
                    <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Files</h4>
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

                    {/* File Categories */}
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
                </>
            )}

            {/* If no fileStats, show placeholder for the remaining space */}
            {!fileStats && (
                <div className="flex-1 px-4 py-4 flex items-center justify-center text-gray-500 text-sm">
                    No shared files yet
                </div>
            )}
        </motion.aside>
    );
};