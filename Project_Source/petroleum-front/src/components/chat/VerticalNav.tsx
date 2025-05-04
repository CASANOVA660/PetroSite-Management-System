import { HomeIcon, UserGroupIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export const VerticalNav: React.FC = () => (
    <nav className="flex flex-col items-center py-6 bg-white rounded-l-3xl shadow-lg h-full w-16">
        <div className="flex-1 flex flex-col items-center space-y-8">
            <button className="p-2 rounded-full hover:bg-gray-100">
                <HomeIcon className="w-6 h-6 text-gray-400" />
            </button>
            <button className="p-2 rounded-full bg-green-100">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
                <UserGroupIcon className="w-6 h-6 text-gray-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
                <ChartBarIcon className="w-6 h-6 text-gray-400" />
            </button>
        </div>
        <div className="mt-auto mb-2">
            <img src="/avatar-placeholder.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-white shadow" />
        </div>
    </nav>
); 