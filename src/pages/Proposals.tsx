import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
    Plus,
    Search,
    LayoutGrid,
    Table as TableIcon,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Copy,
    Link,
    Clock,
    FileText,
    Calculator,
    ChevronDown,
    X,
    RefreshCw,
    Send,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../lib/api';
import { ViewAnalyticsModal } from '../components/ViewAnalyticsModal';
import { ProposalCard } from '../components/ProposalCard';

interface Proposal {
    id: number;
    title: string;
    client_name: string;
    client_company?: string;
    calculator_type: 'marketing' | 'custom';
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    calculator_data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    last_viewed_at?: string;
    view_count?: number;
    avg_session_duration?: number;
    revision_count?: number;
    cover_photo_url?: string;
}

const statusConfig = {
    draft: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
    sent: { icon: Send, color: 'text-[#CD8417]', bg: 'bg-[#CD8417]/10', label: 'Sent' },
    viewed: { icon: Eye, color: 'text-[#FFC917]', bg: 'bg-[#FFC917]/10', label: 'Viewed' },
    accepted: { icon: CheckCircle, color: 'text-[#8C0000]', bg: 'bg-[#8C0000]/10', label: 'Accepted' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Rejected' }
};

export function Proposals() {
    const navigate = useNavigate();
    const toast = useToast();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });
    const [selectedProposalForAnalytics, setSelectedProposalForAnalytics] = useState<number | null>(null);
    const [displayMode, setDisplayMode] = useState<'table' | 'gallery'>('table');

    useEffect(() => {
        loadProposals();
    }, [viewMode]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadProposals = async () => {
        setLoading(true);
        try {
            const data = await api.getProposals({ trashed: viewMode === 'trash' });
            setProposals(data.proposals || []);
        } catch (error) {
            console.error('Failed to load proposals:', error);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const isTrashMode = viewMode === 'trash';

        setConfirmDialog({
            isOpen: true,
            title: isTrashMode ? 'Permanently Delete Proposal?' : 'Move to Trash?',
            message: isTrashMode
                ? 'This proposal will be permanently deleted and cannot be recovered. This action cannot be undone.'
                : 'This proposal will be moved to trash. You can restore it later if needed.',
            variant: isTrashMode ? 'danger' : 'warning',
            onConfirm: async () => {
                try {
                    await api.deleteProposal(id, isTrashMode);
                    setProposals(proposals.filter(p => p.id !== id));
                    toast.success(isTrashMode ? 'Proposal permanently deleted' : 'Proposal moved to trash');
                } catch (error) {
                    console.error('Failed to delete proposal:', error);
                    toast.error('Failed to delete proposal');
                }
            },
        });
    };

    const handleRestore = async (id: number) => {
        try {
            await api.restoreProposal(id);
            setProposals(proposals.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to restore proposal:', error);
            toast.error('Failed to restore proposal');
        }
    };

    const handleView = (proposal: Proposal) => {
        let path: string;
        if (proposal.calculator_type === 'custom') {
            // For custom calculators, we need the calculator definition ID
            const calculatorDefinitionId = (proposal.calculator_data as any)?.calculatorDefinitionId;
            if (calculatorDefinitionId) {
                path = `/calculator/custom/${calculatorDefinitionId}?id=${proposal.id}`;
            } else {
                toast.error('Calculator definition not found');
                return;
            }
        } else {
            // Default to marketing calculator
            path = `/calculator/marketing?id=${proposal.id}`;
        }
        navigate(path);
    };

    const copyShareLink = async (proposalId: number) => {
        try {
            // Generate the share link (you can customize the base URL)
            const baseUrl = window.location.origin;
            const shareLink = `${baseUrl}/view/${proposalId}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(shareLink);
            toast.success('Share link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Failed to copy link');
        }
    };

    const getProposalValue = (proposal: Proposal) => {
        try {
            const data = proposal.calculator_data as { totals?: { monthlyTotal?: number } };
            if (data?.totals?.monthlyTotal) {
                return data.totals.monthlyTotal;
            }
            return 0;
        } catch {
            return 0;
        }
    };

    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = proposal.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            proposal.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
        const matchesType = typeFilter === 'all' || proposal.calculator_type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <>
            <DashboardLayout>
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proposals</h1>
                            <p className="text-gray-500 mt-1">Manage and track your client proposals</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#8C0000] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#A00000] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#8C0000]/20 hover:shadow-[#8C0000]/30 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Proposal
                        </button>
                    </div>

                    {/* Main Toolbar */}
                    <div className="bg-white rounded-2xl border border-gray-200/75 p-3 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                            {/* Tabs */}
                            <div className="flex items-center bg-gray-100/50 p-1 rounded-xl self-start md:self-auto">
                                <button
                                    onClick={() => setViewMode('active')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'active'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                >
                                    All Proposals
                                </button>
                                <button
                                    onClick={() => setViewMode('trash')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'trash'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                                >
                                    Trash
                                </button>
                            </div>

                            {/* Search & Filters Group */}
                            <div className="flex flex-1 w-full md:w-auto items-center gap-3">
                                <div className="relative flex-1 md:max-w-xs group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#8C0000] transition-colors pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search proposals..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8C0000]/10 focus:border-[#8C0000] hover:border-gray-300 transition-all outline-none text-sm placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 focus:border-[#8C0000] focus:ring-2 focus:ring-[#8C0000]/10 outline-none appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="draft">Draft</option>
                                            <option value="sent">Sent</option>
                                            <option value="viewed">Viewed</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 focus:border-[#8C0000] focus:ring-2 focus:ring-[#8C0000]/10 outline-none appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="marketing">Marketing</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

                                    <div className="flex bg-gray-100/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setDisplayMode('table')}
                                            className={`p-1.5 rounded-md transition-all ${displayMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                            title="Table View"
                                        >
                                            <TableIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDisplayMode('gallery')}
                                            className={`p-1.5 rounded-md transition-all ${displayMode === 'gallery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                            title="Gallery View"
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Proposals List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b82f6]"></div>
                        </div>
                    ) : filteredProposals.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200/75 p-16 text-center shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals found</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                                    ? 'Try adjusting your filters to find what you\'re looking for.'
                                    : 'Get started by creating your first proposal for a client.'}
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#1d4ed8] transition-colors shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Create Proposal
                            </button>
                        </div>
                    ) : displayMode === 'gallery' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredProposals.map((proposal) => (
                                    <ProposalCard
                                        key={proposal.id}
                                        proposal={proposal}
                                        onDelete={handleDelete}
                                        onShare={async (id) => {
                                            try {
                                                const linksData = await api.getLinks(id);
                                                let link = linksData.links?.[0];
                                                if (!link) {
                                                    const result = await api.createLink(id, {});
                                                    link = result.link;
                                                }
                                                if (link?.url) {
                                                    await navigator.clipboard.writeText(link.url);
                                                    toast.success('Link copied to clipboard!');
                                                }
                                            } catch (error) {
                                                console.error('Failed to share:', error);
                                                toast.error('Failed to generate share link');
                                            }
                                        }}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200/75 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client & Title</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <AnimatePresence>
                                        {filteredProposals.map((proposal) => {
                                            const status = statusConfig[proposal.status];
                                            const StatusIcon = status.icon;

                                            return (
                                                <motion.tr
                                                    key={proposal.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => handleView(proposal)}
                                                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-semibold text-gray-900 group-hover:text-[#3b82f6] transition-colors">{proposal.client_name}</div>
                                                            <div className="text-sm text-gray-500 truncate max-w-[200px]">{proposal.title}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium border ${proposal.calculator_type === 'marketing'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            }`}>
                                                            {proposal.calculator_type === 'marketing' ? 'Marketing' : 'Custom'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            ${getProposalValue(proposal).toLocaleString()}
                                                            <span className="text-xs font-normal text-gray-400 ml-1">/mo</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(proposal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1" title="Views">
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>{proposal.view_count || 0}</span>
                                                            </div>
                                                            {proposal.last_viewed_at && (
                                                                <div className="flex items-center gap-1" title="Last Viewed">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span>{new Date(proposal.last_viewed_at).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2 relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenu(activeMenu === proposal.id ? null : proposal.id);
                                                                }}
                                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>

                                                            {activeMenu === proposal.id && (
                                                                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-1.5 z-[60] min-w-[160px] transform transition-all duration-200 ease-out animate-in slide-in-from-top-2">
                                                                    {viewMode === 'trash' ? (
                                                                        <>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRestore(proposal.id);
                                                                                    setActiveMenu(null);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <RefreshCw className="w-4 h-4" />
                                                                                Restore
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDelete(proposal.id);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                                Delete Forever
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleView(proposal);
                                                                                    setActiveMenu(null);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5" />
                                                                                View
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(`/proposals/${proposal.id}/edit`);
                                                                                    setActiveMenu(null);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Edit className="w-3.5 h-3.5" />
                                                                                Edit
                                                                            </button >
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    copyShareLink(proposal.id);
                                                                                    setActiveMenu(null);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Link className="w-3.5 h-3.5" />
                                                                                Copy Share Link
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveMenu(null);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                                Duplicate
                                                                            </button>
                                                                            <div className="h-px bg-gray-50 my-1" />
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDelete(proposal.id);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                                Move to Trash
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div >
                                                            )}
                                                        </div >
                                                    </td >
                                                </motion.tr >
                                            );
                                        })}
                                    </AnimatePresence >
                                </tbody >
                            </table >
                        </div >
                    )}

                    {/* Create Proposal Modal */}
                    <AnimatePresence>
                        {showCreateModal && (
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
                                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-8"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">Create New Proposal</h2>
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <p className="text-gray-500 mb-6">Select a calculator to start building your proposal</p>

                                    <div className="space-y-4">
                                        <button
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                navigate('/proposals/new?mode=blank');
                                            }}
                                            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#8C0000] hover:bg-red-50/30 transition-all text-left group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#8C0000] to-[#500000] text-white flex items-center justify-center shadow-lg shadow-red-900/20">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#8C0000] transition-colors">Blank Proposal</h3>
                                                    <p className="text-sm text-gray-500">Create from scratch with custom pricing</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                navigate('/calculator/marketing');
                                            }}
                                            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50/30 transition-all text-left group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                                                    <Calculator className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#3b82f6] transition-colors">Marketing Calculator</h3>
                                                    <p className="text-sm text-gray-500">Create proposals for digital marketing services</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                navigate('/calculators');
                                            }}
                                            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                                                    <Calculator className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">Custom Calculator</h3>
                                                    <p className="text-sm text-gray-500">Create or use your own custom pricing calculators</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* View Analytics Modal */}
                    {
                        selectedProposalForAnalytics && (
                            <ViewAnalyticsModal
                                proposalId={selectedProposalForAnalytics}
                                isOpen={!!selectedProposalForAnalytics}
                                onClose={() => setSelectedProposalForAnalytics(null)}
                            />
                        )
                    }
                </div>
            </DashboardLayout>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                confirmText={confirmDialog.variant === 'danger' ? 'Delete Permanently' : 'Move to Trash'}
            />
        </>
    );
}