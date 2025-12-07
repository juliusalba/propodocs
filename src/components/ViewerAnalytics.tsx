import { useState, useEffect } from 'react';
import {
    Eye,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    Mail
} from 'lucide-react';
import { api } from '../lib/api';

interface Viewer {
    id: number;
    email: string;
    name: string;
    company?: string;
    first_viewed_at: string;
    last_viewed_at: string;
    view_count: number;
    total_time_seconds: number;
    avg_scroll_depth: number;
}

interface ViewerAnalyticsProps {
    proposalId: number;
    className?: string;
}

export function ViewerAnalytics({ proposalId, className = '' }: ViewerAnalyticsProps) {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadViewers();
    }, [proposalId]);

    const loadViewers = async () => {
        try {
            const data = await api.getProposalViewers(proposalId);
            setViewers(data.viewers || []);
        } catch (error) {
            console.error('Failed to load viewers:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        return `${Math.floor(diffDays / 7)} weeks ago`;
    };

    if (loading || viewers.length === 0) {
        return null;
    }

    const totalViews = viewers.reduce((sum, v) => sum + v.view_count, 0);
    const mostActiveViewer = viewers.reduce((max, v) => v.view_count > max.view_count ? v : max, viewers[0]);

    return (
        <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
            {/* Header Summary */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                            {viewers.length} viewer{viewers.length !== 1 ? 's' : ''} • {totalViews} view{totalViews !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                            {mostActiveViewer.name || mostActiveViewer.email.split('@')[0]} viewed {mostActiveViewer.view_count}x
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {/* Expanded View */}
            {expanded && (
                <div className="border-t border-gray-100">
                    {viewers.map((viewer) => (
                        <div key={viewer.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                        {viewer.name ? viewer.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {viewer.name || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {viewer.email}
                                        </p>
                                        {viewer.company && (
                                            <p className="text-xs text-gray-400">{viewer.company}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs">
                                        <Eye className="w-3 h-3 text-purple-500" />
                                        <span className="font-medium text-gray-700">{viewer.view_count}x</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatTimeAgo(viewer.last_viewed_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-4 mt-2 pl-12">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDuration(viewer.total_time_seconds)} total</span>
                                </div>
                                {viewer.avg_scroll_depth > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>{viewer.avg_scroll_depth}% read</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Compact inline version for proposal cards
export function ViewerBadge({ proposalId }: { proposalId: number }) {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getProposalViewers(proposalId);
                setViewers(data.viewers || []);
            } catch {
                // Silently fail
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [proposalId]);

    if (loading || viewers.length === 0) return null;

    const totalViews = viewers.reduce((sum, v) => sum + v.view_count, 0);
    const topViewer = viewers[0];

    return (
        <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            <span className="font-medium">{totalViews}</span>
            {topViewer && (
                <span className="text-purple-500">
                    • {topViewer.name?.split(' ')[0] || topViewer.email.split('@')[0]}
                </span>
            )}
        </div>
    );
}
