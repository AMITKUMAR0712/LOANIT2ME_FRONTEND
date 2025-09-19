import { Bell, CheckCircle, Clock, CreditCard, XCircle } from "lucide-react";
import { useState } from "react";

// Notification History Section Component
export function NotificationHistorySection({ notifications, onMarkAsRead }) {
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'read') return notification.isRead;
        return true;
    });

    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const notificationDate = new Date(dateString);
        const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    const getNotificationIcon = (message) => {
        if (message.toLowerCase().includes('approved')) return <CheckCircle className="w-5 h-5 text-mantis-400" />;
        if (message.toLowerCase().includes('rejected')) return <XCircle className="w-5 h-5 text-fern_green-300" />;
        if (message.toLowerCase().includes('payment')) return <CreditCard className="w-5 h-5 text-celadon-400" />;
        if (message.toLowerCase().includes('due') || message.toLowerCase().includes('reminder')) return <Clock className="w-5 h-5 text-mantis-400" />;
        return <Bell className="w-5 h-5 text-fern_green-400" />;
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-fern_green-500 border-b border-celadon-300 pb-2">
                        Notification History
                    </h2>
                    {unreadCount > 0 && (
                        <div className="bg-mantis-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {unreadCount} unread
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    {/* Filter Dropdown */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-white border border-celadon-300 rounded-lg px-4 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-400"
                    >
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-celadon-300 rounded-lg px-4 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-400"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            {sortedNotifications.length ? (
                <div className="space-y-3">
                    {sortedNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${notification.isRead
                                ? 'bg-white border-celadon-200 hover:shadow-md'
                                : 'bg-celadon-100 bg-opacity-10 border-celadon-300 shadow-sm hover:shadow-md'
                                }`}
                            onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full ${notification.isRead ? 'bg-celadon-800' : 'bg-mantis-900'}`}>
                                    {getNotificationIcon(notification.message)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className={`font-medium ${notification.isRead ? 'text-fern_green-400' : 'text-fern_green-500'}`}>
                                            {notification.message}
                                        </p>
                                        {!notification.isRead && (
                                            <div className="w-3 h-3 bg-mantis-400 rounded-full"></div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-fern_green-300">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                        <span className="text-xs text-mantis-400">
                                            {getTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-celadon-100 bg-opacity-10 p-8 rounded-xl border border-celadon-200">
                        <Bell className="w-16 h-16 text-celadon-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-fern_green-500 mb-2">
                            {filter === 'unread' ? 'No Unread Notifications' :
                                filter === 'read' ? 'No Read Notifications' : 'No Notifications'}
                        </h3>
                        <p className="text-fern_green-400">
                            {filter === 'all'
                                ? 'You haven\'t received any notifications yet.'
                                : `You don't have any ${filter} notifications.`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
