import { useState, useEffect } from 'react';
import { X, Eye, Clock, Monitor, Smartphone, Tablet, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ViewAnalyticsModalProps {
    proposalId: number;
    isOpen: boolean;
    onClose: () => void;
}

interface Session {
    id: number;
    session_id: string;
    viewed_at: string;
    duration_seconds: number;
    device_type: string;
    browser: string;
    location?: string;
}

interface GroupedSessions {
    [date: string]: Session[];
}

export function ViewAnalyticsModal({ proposalId, isOpen, onClose }: ViewAnalyticsModalProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            loadSessions();
        }
    }, [isOpen, proposalId]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await api.getSessions(proposalId);
            setSessions(data.sessions || []);

            // Auto-expand today's sessions
            const today = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            setExpandedDates(new Set([today]));
        } catch (error) {
            console.error('Failed to load sessions:', error);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const groupSessionsByDate = (): GroupedSessions => {
        const grouped: GroupedSessions = {};

        sessions.forEach(session => {
            try {
                // Handle both string and Date object formats
                const dateObj = session.viewed_at ? new Date(session.viewed_at) : new Date();

                // Check if date is valid
                if (isNaN(dateObj.getTime())) {
                    console.warn('Invalid date for session:', session);
                    return;
                }

                const date = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(session);
            } catch (error) {
                console.error('Error parsing date for session:', session, error);
            }
        });

        return grouped;
    };

    const formatDuration = (seconds: number): string => {
        if (!seconds || seconds < 1) return '< 1 sec';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        if (minutes === 0) {
            return `${remainingSeconds} sec`;
        }

        return `${minutes} min ${remainingSeconds} sec`;
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType?.toLowerCase()) {
            case 'mobile':
                return Smartphone;
            case 'tablet':
                return Tablet;
            default:
                return Monitor;
        }
    };

    const toggleDate = (date: string) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(date)) {
            newExpanded.delete(date);
        } else {
            newExpanded.add(date);
        }
        setExpandedDates(newExpanded);
    };

    const getTotalViews = () => sessions.length;

    const getAverageDuration = () => {
        if (sessions.length === 0) return 0;
        const total = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
        return total / sessions.length;
    };

    const groupedSessions = groupSessionsByDate();
    const sortedDates = Object.keys(groupedSessions).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-[#050505] flex items-center gap-2">
                                <Eye className="w-5 h-5 text-[#8C0000]" />
                                View Analytics
                            </h2>
                            <p className="text-sm text-[#050505]/60 mt-1">Detailed viewing history and session data</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="px-6 py-4 bg-[#FAF3CD] border-b border-[#CD8417]/20 flex-shrink-0">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#CD8417]/20">
                                <div className="flex items-center gap-2 text-[#8C0000] mb-1">
                                    <Eye className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
                                </div>
                                <div className="text-2xl font-black text-[#050505]">{getTotalViews()}</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#CD8417]/20">
                                <div className="flex items-center gap-2 text-[#8C0000] mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Avg Duration</span>
                                </div>
                                <div className="text-2xl font-black text-[#050505]">{formatDuration(getAverageDuration())}</div>
                            </div>
                        </div>
                    </div>

                    {/* Sessions List */}
                    <div className="flex-1 overflow-y-auto p-6 min-h-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C0000]"></div>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No views yet</p>
                                <p className="text-sm text-gray-400 mt-1">Share this proposal to start tracking views</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedDates.map(date => {
                                    const dateSessions = groupedSessions[date];
                                    const isExpanded = expandedDates.has(date);
                                    const isToday = date === new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });

                                    return (
                                        <div key={date} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleDate(date)}
                                                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    <Calendar className="w-4 h-4 text-gray-600" />
                                                    <span className="font-semibold text-gray-900">
                                                        {isToday ? 'Today' : date}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-md">
                                                    {dateSessions.length} {dateSessions.length === 1 ? 'view' : 'views'}
                                                </span>
                                            </button>

                                            {isExpanded && (
                                                <div className="divide-y divide-gray-100">
                                                    {dateSessions.map((session, index) => {
                                                        const DeviceIcon = getDeviceIcon(session.device_type);
                                                        const time = new Date(session.viewed_at).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        });

                                                        return (
                                                            <div key={session.id || index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-[#8C0000]/10 flex items-center justify-center">
                                                                            <DeviceIcon className="w-4 h-4 text-[#8C0000]" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-semibold text-gray-900">{time}</span>
                                                                                {session.browser && (
                                                                                    <span className="text-xs text-gray-500">• {session.browser}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <Clock className="w-3 h-3 text-gray-400" />
                                                                                <span className="text-xs text-gray-500">
                                                                                    {formatDuration(session.duration_seconds)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                                                            {session.device_type || 'Desktop'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
