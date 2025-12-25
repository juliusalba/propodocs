import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    FileText,
    CheckCircle,
    Eye,
    MoreVertical,
    Calendar,
    ArrowRight,
    XCircle,
    MessageSquare,
    Bell,
    Activity,
    Share2,
    Loader2,
    TrendingUp,
    Wand2,
    Calculator,
    Sparkles,
    LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { PipelineChart } from '../components/dashboard/PipelineChart';
import { ViewAnalyticsModal } from '../components/ViewAnalyticsModal';
import { ChangelogModal } from '../components/ChangelogModal';
import type { Proposal } from '../types';
import { useToast } from '../components/Toast';

interface RecentUpdate {
    id: string;
    type: 'comment' | 'view' | 'status' | 'create';
    title: string;
    description: string;
    proposalId?: number;
    proposalTitle?: string;
    timestamp: Date;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

export function Dashboard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
    const [pipelineData, setPipelineData] = useState<any>(null);
    const [loadingPipeline, setLoadingPipeline] = useState(true);
    const [selectedStat, setSelectedStat] = useState<any>(null);
    const [showStatModal, setShowStatModal] = useState(false);
    const [selectedProposalForAnalytics, setSelectedProposalForAnalytics] = useState<number | null>(null);
    const [pipelineTimePeriod, setPipelineTimePeriod] = useState('all');
    const [showChangelog, setShowChangelog] = useState(false);
    const [hasNewChangelog, setHasNewChangelog] = useState(false);
    const CURRENT_VERSION = '2.2.0';

    useEffect(() => {
        loadProposals();
        loadPipelineStats();

        const lastViewedVersion = localStorage.getItem('lastViewedChangelogVersion');
        if (lastViewedVersion !== CURRENT_VERSION) {
            setHasNewChangelog(true);
        }
    }, []);

    const handleOpenChangelog = () => {
        setShowChangelog(true);
        setHasNewChangelog(false);
        localStorage.setItem('lastViewedChangelogVersion', CURRENT_VERSION);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadPipelineStats = async () => {
        try {
            const data = await api.getPipelineStats();
            // Filter data based on time period
            const filteredData = filterPipelineByPeriod(data);
            setPipelineData(filteredData);
        } catch (error) {
            console.error('Failed to load pipeline stats:', error);
        } finally {
            setLoadingPipeline(false);
        }
    };

    const loadProposals = async () => {
        try {
            const data = await api.getProposals();
            setProposals(data.proposals || []);
            generateRecentUpdates(data.proposals || []);
        } catch (error) {
            console.error('Failed to load proposals:', error);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    const filterPipelineByPeriod = (data: any) => {
        if (!data || pipelineTimePeriod === 'all') return data;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Filter proposals based on created_at
        let filteredProposals = proposals;
        if (pipelineTimePeriod === 'month') {
            filteredProposals = proposals.filter(p => new Date(p.created_at) >= startOfMonth);
        } else if (pipelineTimePeriod === 'ytd') {
            filteredProposals = proposals.filter(p => new Date(p.created_at) >= startOfYear);
        }

        // Single-pass grouping by status
        const groupedByStatus = filteredProposals.reduce((acc, p) => {
            const status = p.status || 'draft';
            if (!acc[status]) {
                acc[status] = { proposals: [], value: 0, count: 0 };
            }
            acc[status].proposals.push(p);
            acc[status].value += (p.calculator_data.totals?.annualTotal || 0);
            acc[status].count += 1;
            return acc;
        }, {} as Record<string, any>);

        // Map over breakdown items using pre-grouped data
        const breakdown = data.breakdown.map((item: any) => {
            const statusData = groupedByStatus[item.status] || { value: 0, count: 0 };
            return {
                ...item,
                value: statusData.value,
                count: statusData.count
            };
        });

        const totalPipelineValue = breakdown.reduce((acc: number, item: any) => acc + item.value, 0);

        return {
            totalPipelineValue,
            breakdown
        };
    };

    const generateRecentUpdates = (proposals: Proposal[]) => {
        const updates: RecentUpdate[] = [];

        proposals.slice(0, 5).forEach((proposal) => {
            // Add proposal creation update
            if (proposal.created_at) {
                updates.push({
                    id: `create-${proposal.id}`,
                    type: 'create',
                    title: 'New Proposal Created',
                    description: `${proposal.author || 'User'} - ${proposal.client_name || 'No Client'}`,
                    proposalId: proposal.id,
                    proposalTitle: proposal.title,
                    timestamp: new Date(proposal.created_at),
                    icon: Plus,
                    color: 'bg-[#8C0000]'
                });
            }

            // Add comment update if there are comments
            if (proposal.comment_count && proposal.comment_count > 0) {
                updates.push({
                    id: `comment-${proposal.id}`,
                    type: 'comment',
                    title: 'New Comment Added',
                    description: `${proposal.comment_count} comment${proposal.comment_count > 1 ? 's' : ''} on ${proposal.client_name}`,
                    proposalId: proposal.id,
                    proposalTitle: proposal.title,
                    timestamp: new Date(proposal.updated_at),
                    icon: MessageSquare,
                    color: 'bg-green-500'
                });
            }

            // Add status update if recently changed
            if (proposal.updated_at && proposal.status !== 'draft') {
                const updatedTime = new Date(proposal.updated_at);
                const hoursDiff = (Date.now() - updatedTime.getTime()) / (1000 * 60 * 60);
                if (hoursDiff < 24) {
                    updates.push({
                        id: `status-${proposal.id}`,
                        type: 'status',
                        title: 'Status Updated',
                        description: `${proposal.client_name} proposal marked as ${proposal.status}`,
                        proposalId: proposal.id,
                        proposalTitle: proposal.title,
                        timestamp: updatedTime,
                        icon: Activity,
                        color: 'bg-[#CD8417]' // Propodocs Gold
                    });
                }
            }

            // Add view updates
            if (proposal.view_sessions && proposal.view_sessions.length > 0) {
                const latestView = proposal.view_sessions[0]; // Assuming view_sessions are sorted by viewed_at desc
                const hoursDiff = (Date.now() - new Date(latestView.viewed_at).getTime()) / (1000 * 60 * 60);
                if (hoursDiff < 24) {
                    updates.push({
                        id: `view-${latestView.id}`,
                        type: 'view',
                        title: 'Proposal Viewed',
                        description: `${latestView.location || 'Unknown Location'} • ${latestView.device_type || 'Unknown Device'}`,
                        proposalId: proposal.id,
                        proposalTitle: proposal.title,
                        timestamp: new Date(latestView.viewed_at),
                        icon: Eye,
                        color: 'bg-[#FFC917]' // Propodocs Yellow
                    });
                }
            }
        });

        // Sort by timestamp (most recent first) and take top 10
        setRecentUpdates(updates
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10)
        );
    };

    const handleGetShareableLink = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Check for existing links
            const linksData = await api.getLinks(id);
            let link = linksData.links?.[0];

            if (!link) {
                // Create new link
                const result = await api.createLink(id, {});
                link = result.link;
            }

            if (link && link.url) {
                await navigator.clipboard.writeText(link.url);
                toast.success("Link copied to clipboard!");
            } else {
                toast.error("Could not generate link");
            }
        } catch (error) {
            console.error("Failed to get shareable link:", error);
            toast.error("Failed to get shareable link");
        }
        setActiveDropdown(null);
    };

    const handleDeleteProposal = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this proposal?')) {
            try {
                await api.deleteProposal(id);
                setProposals(proposals.filter(p => p.id !== id));
            } catch (error) {
                console.error('Failed to delete proposal:', error);
                toast.error('Failed to delete proposal');
            }
        }
        setActiveDropdown(null);
    };

    // Calculate dynamic stats
    const totalViews = proposals.reduce((acc, p) => acc + (p.view_count || 0), 0);
    const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
    const draftCount = proposals.filter(p => p.status === 'draft').length;
    const sentCount = proposals.filter(p => p.status === 'sent').length;
    const conversionRate = proposals.length ? Math.round((acceptedCount / proposals.length) * 100) : 0;

    const stats = [
        {
            title: 'Total Proposals',
            value: proposals.length,
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            trend: draftCount > 0 ? `${draftCount} draft${draftCount > 1 ? 's' : ''}` : 'No drafts'
        },
        {
            title: 'Total Views',
            value: totalViews,
            icon: Eye,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            trend: totalViews > 0 ? 'Across all proposals' : 'No views yet'
        },
        {
            title: 'Accepted',
            value: acceptedCount,
            icon: CheckCircle,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            trend: sentCount > 0 ? `${sentCount} pending` : 'None pending'
        },
        {
            title: 'Conversion Rate',
            value: `${conversionRate}%`,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            trend: proposals.length > 0 ? `${acceptedCount}/${proposals.length} accepted` : 'No data'
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-200 text-gray-800';
            case 'sent': return 'bg-blue-500 text-white';
            case 'viewed': return 'bg-purple-500 text-white';
            case 'accepted': return 'bg-green-500 text-white';
            case 'rejected': return 'bg-red-500 text-white';
            default: return 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenChangelog}
                        className="relative flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all text-sm"
                    >
                        <Sparkles className="w-4 h-4 text-[#CD8417]" />
                        What's New
                        {hasNewChangelog && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C0000] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8C0000]"></span>
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#8C0000] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#A00000] transition-all shadow-lg shadow-red-900/20 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Proposal
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                    onClick={() => navigate('/calculators/new')}
                    className="bg-gradient-to-br from-[#8C0000] to-[#500000] rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-red-900/20 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wand2 className="w-32 h-32 -rotate-12 translate-x-8 -translate-y-8" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Wand2 className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Calculator Creator</h3>
                        <p className="text-red-100 text-sm mb-4">Build custom service calculators with AI.</p>
                        <div className="flex items-center gap-2 text-sm font-medium bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                            Start Building <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/templates')}
                    className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-[#CD8417] hover:shadow-lg hover:shadow-orange-900/5 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <LayoutTemplate className="w-32 h-32 -rotate-12 translate-x-8 -translate-y-8 text-[#CD8417]" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-[#FAF3CD] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LayoutTemplate className="w-5 h-5 text-[#CD8417]" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Templates</h3>
                        <p className="text-gray-500 text-sm mb-4">Start with pre-built agency templates.</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-[#CD8417] group-hover:gap-3 transition-all">
                            Browse Library <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setShowCreateModal(true)}
                    className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-[#8C0000] hover:shadow-lg hover:shadow-red-900/5 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <FileText className="w-32 h-32 -rotate-12 translate-x-8 -translate-y-8 text-[#8C0000]" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5 text-[#8C0000]" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">New Proposal</h3>
                        <p className="text-gray-500 text-sm mb-4">Create a proposal from existing calculators.</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-[#8C0000] group-hover:gap-3 transition-all">
                            Create Now <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Section: Recent Updates & Comments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Recent Updates */}
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-[400px] hover:border-gray-200 transition-colors">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#CD8417]/10 rounded-xl flex items-center justify-center">
                                <Bell className="w-5 h-5 text-[#CD8417]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Recent Updates</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Real-time activity feed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CD8417] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#CD8417]"></span>
                            </span>
                            <span className="text-xs font-bold text-[#CD8417]">Live</span>
                        </div>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                        {recentUpdates.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Activity className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-900 font-medium mb-1">No recent activity</p>
                                <p className="text-gray-500 text-sm">Updates will appear here as you work</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {recentUpdates.map((update) => {
                                    const IconComponent = update.icon;
                                    return (
                                        <motion.div
                                            key={update.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer"
                                            onClick={() => update.proposalId && navigate(`/proposals/${update.proposalId}/edit`)}
                                        >
                                            <div className={`w-9 h-9 ${update.color} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                                <IconComponent className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900 text-sm group-hover:text-[#8C0000] transition-colors">
                                                            {update.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                            {update.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            {update.proposalTitle && (
                                                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                                                    {update.proposalTitle}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400">
                                                                {update.timestamp.toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Comments */}
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-[400px] hover:border-gray-200 transition-colors">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Recent Comments</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Latest discussions</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                        {recentUpdates.filter(u => u.type === 'comment').length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-900 font-medium mb-1">No recent comments</p>
                                <p className="text-gray-500 text-sm">Comments will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {recentUpdates.filter(u => u.type === 'comment').map((update) => (
                                    <motion.div
                                        key={update.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer"
                                        onClick={() => update.proposalId && navigate(`/proposals/${update.proposalId}/edit`)}
                                    >
                                        <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                                            <MessageSquare className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm group-hover:text-green-600 transition-colors">
                                                {update.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {update.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {update.proposalTitle && (
                                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                                        {update.proposalTitle}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400">
                                                    {update.timestamp.toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group"
                        onClick={() => {
                            setSelectedStat(stat);
                            setShowStatModal(true);
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            {stat.trend && (
                                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                    <TrendingUp className="w-3 h-3" />
                                    {stat.trend}
                                </div>
                            )}
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                    <div className="h-[400px]">
                        <PipelineChart
                            data={pipelineData}
                            loading={loadingPipeline}
                            timePeriod={pipelineTimePeriod}
                            onPeriodChange={(period) => {
                                setPipelineTimePeriod(period);
                                loadPipelineStats();
                            }}
                        />
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-[400px] flex flex-col">
                        <h3 className="text-base font-bold text-gray-900 mb-3">Recent Activity</h3>
                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                            {recentUpdates.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 text-xs">No recent activity</p>
                            ) : (
                                recentUpdates.slice(0, 6).map((update) => (
                                    <div key={update.id} className="flex gap-3">
                                        <div className={`w-2 h-2 mt-1.5 rounded-full ${update.color} flex-shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 leading-tight">{update.title}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{update.description}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(update.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Proposals */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent Proposals</h2>
                    <button
                        onClick={() => navigate('/proposals')}
                        className="text-sm text-[#8C0000] font-medium hover:text-[#A00000] transition-colors"
                    >
                        View All
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
                                        </div>
                                    </td>
                                </tr>
                            ) : proposals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <FileText className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-medium mb-1">No proposals yet</p>
                                            <p className="text-gray-500 text-sm">Create your first proposal to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                proposals.map((proposal) => (
                                    <tr
                                        key={proposal.id}
                                        onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-medium text-gray-900">{proposal.client_name}</p>
                                                <p className="text-xs text-gray-500">{proposal.client_company || 'No Company'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {proposal.calculator_type === 'marketing' ? 'Marketing' : 'Custom'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm ${getStatusColor(proposal.status)}`}>
                                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-medium text-gray-900">
                                                ${(proposal.calculator_data.totals?.monthlyTotal || 0).toLocaleString()}/mo
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProposalForAnalytics(proposal.id);
                                                }}
                                                className="flex items-center gap-2 text-[#8C0000] hover:text-[#A00000] font-medium transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="text-sm">{proposal.view_count || 0}</span>
                                            </button>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {proposal.comment_count && proposal.comment_count > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <MessageSquare className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm font-medium text-green-700">
                                                            {proposal.comment_count}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">No comments</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(proposal.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === proposal.id ? null : proposal.id);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {activeDropdown === proposal.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] overflow-hidden transform transition-all animate-in slide-in-from-top-2 duration-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/proposals/${proposal.id}/edit`);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        Edit Proposal
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            handleGetShareableLink(proposal.id, e);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                        Get Shareable Link
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            handleDeleteProposal(proposal.id, e);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div >
            </div >


            {/* Create Proposal Modal */}
            <AnimatePresence>
                {
                    showCreateModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCreateModal(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 p-8"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Create New Proposal</h2>
                                        <p className="text-gray-500 mt-1">Select a calculator to start generating your proposal</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <XCircle className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            navigate('/proposals/new?mode=blank');
                                        }}
                                        className="group relative p-6 rounded-xl border-2 border-gray-100 hover:border-[#8C0000] hover:bg-red-50/30 transition-all text-left"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-red-100 text-[#8C0000] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Blank Proposal</h3>
                                        <p className="text-sm text-gray-500 mb-4">Create from scratch with custom pricing. Import your own terms.</p>
                                        <div className="flex items-center text-[#8C0000] font-medium text-sm">
                                            Start Fresh <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/calculators')}
                                        className="group relative p-6 rounded-xl border-2 border-gray-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all text-left"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Calculator className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">My Calculators</h3>
                                        <p className="text-sm text-gray-500 mb-4">Use your saved custom calculators to generate proposals.</p>
                                        <div className="flex items-center text-blue-600 font-medium text-sm">
                                            View Calculators <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/templates')}
                                        className="group relative p-6 rounded-xl border-2 border-gray-100 hover:border-purple-600 hover:bg-purple-50/30 transition-all text-left"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <LayoutTemplate className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Templates</h3>
                                        <p className="text-sm text-gray-500 mb-4">Start with a pre-built industry template.</p>
                                        <div className="flex items-center text-purple-600 font-medium text-sm">
                                            Browse Templates <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/calculators/new')}
                                        className="group relative p-6 rounded-xl border-2 border-gray-100 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all text-left"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Wand2 className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Create Calculator</h3>
                                        <p className="text-sm text-gray-500 mb-4">Design a new calculator with AI assistance.</p>
                                        <div className="flex items-center text-emerald-600 font-medium text-sm">
                                            Start Building <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >

            {/* Stat Details Modal */}
            <AnimatePresence>
                {
                    showStatModal && selectedStat && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowStatModal(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 p-8"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${selectedStat.color} shadow-lg shadow-current/20`}>
                                            <selectedStat.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedStat.label} Details</h2>
                                            <p className="text-gray-500 mt-1">Detailed breakdown of {selectedStat.label.toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowStatModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <XCircle className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 max-h-[400px] overflow-y-auto">
                                    <p className="text-gray-600">
                                        Detailed analytics and logs for {selectedStat.label} will be displayed here.
                                        {/* Placeholder for future detailed data */}
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        {selectedStat.label === 'Total Proposals' && proposals.map(p => (
                                            <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                                                <span className="font-medium">{p.client_name}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(p.status)}`}>{p.status}</span>
                                            </div>
                                        ))}
                                        {selectedStat.label === 'Total Views' && (
                                            <div className="text-sm text-gray-500">
                                                Total views across all proposals: {selectedStat.value}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >

            {/* View Analytics Modal */}
            {selectedProposalForAnalytics && (
                <ViewAnalyticsModal
                    proposalId={selectedProposalForAnalytics}
                    isOpen={!!selectedProposalForAnalytics}
                    onClose={() => setSelectedProposalForAnalytics(null)}
                />
            )}

            <ChangelogModal
                isOpen={showChangelog}
                onClose={() => setShowChangelog(false)}
            />
        </DashboardLayout >
    );
}
