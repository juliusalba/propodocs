import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, FileText, Eye, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface Notification {
    id: string;
    type: 'proposal_viewed' | 'proposal_accepted' | 'proposal_created' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

interface ProposalData {
    id: number;
    title: string;
    status: string;
    view_count?: number;
    updated_at?: string;
    created_at: string;
}

export function TopBar() {
    const { user } = useAuth();
    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('readNotifications') || '[]');
        } catch {
            return [];
        }
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [archivedIds, setArchivedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('archivedNotifications') || '[]');
        } catch {
            return [];
        }
    });
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.getProposals();
                const proposals: ProposalData[] = response.proposals || [];

                // Generate notifications from recent proposals
                const generatedNotifications: Notification[] = [];

                proposals.forEach(() => {
                });

                // Add a welcome notification if no proposals
                if (generatedNotifications.length === 0) {
                    generatedNotifications.push({
                        id: 'welcome',
                        type: 'system',
                        title: 'Welcome to Pricing Calculator',
                        message: 'Create your first proposal to get started!',
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                }

                // Combine with stored read state
                const combinedNotifications = generatedNotifications.map(n => ({
                    ...n,
                    read: readIds.includes(n.id)
                }));

                // Filter out archived notifications
                const activeNotifications = combinedNotifications.filter(n => !archivedIds.includes(n.id));

                // Sort by date descending
                activeNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                setNotifications(activeNotifications);
            } catch {
                // If API fails, show a default notification
                setNotifications([{
                    id: 'welcome',
                    type: 'system',
                    title: 'Welcome to Pricing Calculator',
                    message: 'Create your first proposal to get started!',
                    read: false,
                    createdAt: new Date().toISOString()
                }]);
            }
        };

        if (user) {
            fetchNotifications();
        }
    }, [user, archivedIds]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        const newReadIds = [...readIds, id];
        setReadIds(newReadIds);
        localStorage.setItem('readNotifications', JSON.stringify(newReadIds));

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        const newReadIds = [...new Set([...readIds, ...allIds])];
        setReadIds(newReadIds);
        localStorage.setItem('readNotifications', JSON.stringify(newReadIds));

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const archiveNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newArchived = [...archivedIds, id];
        setArchivedIds(newArchived);
        localStorage.setItem('archivedNotifications', JSON.stringify(newArchived));
    };

    const archiveAll = () => {
        const newArchived = [...archivedIds, ...notifications.map(n => n.id)];
        setArchivedIds(newArchived);
        localStorage.setItem('archivedNotifications', JSON.stringify(newArchived));
        setNotifications([]);
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'proposal_viewed':
                return <Eye className="w-4 h-4 text-blue-500" />;
            case 'proposal_accepted':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'proposal_created':
                return <FileText className="w-4 h-4 text-purple-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
            {/* Search */}
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search proposals..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000] hover:border-gray-300 transition-all"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 border border-gray-100 overflow-hidden z-[60]">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-[#8C0000] text-white text-xs rounded-full font-medium">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Mark read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={archiveAll}
                                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                        >
                                            Archive all
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-12 text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium mb-1">All caught up!</p>
                                        <p className="text-xs text-gray-500">No new notifications to display.</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 6).map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`group px-4 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all relative ${!notification.read ? 'bg-blue-50/30' : ''
                                                }`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 p-2 rounded-full ${!notification.read ? 'bg-white shadow-sm ring-1 ring-gray-100' : 'bg-gray-100'
                                                    }`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Archive Button - Visible on Hover */}
                                            <button
                                                onClick={(e) => archiveNotification(notification.id, e)}
                                                className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                                title="Archive"
                                            >
                                                <span className="sr-only">Archive</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>

                                            {/* Unread Indicator */}
                                            {!notification.read && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#8C0000] rounded-r-full" />
                                            )}
                                        </div>
                                    ))
                                )}
                                {notifications.length > 6 && (
                                    <div className="p-2 text-center border-t border-gray-50 bg-gray-50/50">
                                        <span className="text-xs text-gray-500">Scroll for more</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.company || 'Admin'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200 overflow-hidden">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <User className={`w-5 h-5 text-gray-600 ${user?.avatar_url ? 'hidden' : ''}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
