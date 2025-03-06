import { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchNotifications, markAsRead, addNotification } from '../store/slices/notificationSlice';

interface Notification {
    _id: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch();
    const notifications = useAppSelector(state => state.notification.notifications);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        dispatch(fetchNotifications());

        socket.on('notification', (data) => {
            console.log('New notification received:', data);
            if (data.type === 'NEW_NOTIFICATION') {
                dispatch(addNotification(data.payload));
            }
        });

        return () => {
            socket.off('notification');
        };
    }, [dispatch]);

    const handleMarkAsRead = async (notificationId: string) => {
        await dispatch(markAsRead(notificationId));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 w-80 mt-2 bg-white rounded-md shadow-lg dark:bg-navy-800 z-50">
                    <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-navy-700">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    Aucune notification
                                </div>
                            ) : (
                                notifications.map((notification: Notification) => (
                                    <div
                                        key={notification._id}
                                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-navy-700 cursor-pointer ${!notification.isRead ? 'bg-blue-50 dark:bg-navy-900' : ''
                                            }`}
                                        onClick={() => handleMarkAsRead(notification._id)}
                                    >
                                        <p className="text-sm text-gray-800 dark:text-white">{notification.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 