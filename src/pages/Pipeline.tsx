import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { api } from '../lib/api';
import type { Proposal } from '../types';
import { Search, Filter, Plus, MoreVertical, Calendar, MessageSquare, FileText, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const PIPELINE_STAGES = [
    { id: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
    { id: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
    { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-purple-50 text-purple-700', border: 'border-purple-100' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
    { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
    { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-50 text-red-700', border: 'border-red-100' }
];

export function Pipeline() {
    const navigate = useNavigate();
    const toast = useToast();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadPipeline();
    }, []);

    const loadPipeline = async () => {
        try {
            const data = await api.getProposals({});
            // Ensure every proposal has a stage, check calculator_data first, then map status
            const mappedProposals = (data.proposals || []).map((p: Proposal) => {
                const calcData = p.calculator_data as any || {};
                return {
                    ...p,
                    pipeline_stage: calcData.pipeline_stage || mapStatusToStage(p.status)
                };
            });
            setProposals(mappedProposals);
        } catch (error) {
            console.error('Failed to load pipeline:', error);
            toast.error('Failed to load pipeline data');
        } finally {
            setLoading(false);
        }
    };

    const mapStatusToStage = (status: string) => {
        switch (status) {
            case 'draft': return 'lead';
            case 'sent': return 'proposal_sent';
            case 'viewed': return 'negotiation';
            case 'accepted': return 'closed_won';
            case 'rejected': return 'closed_lost';
            default: return 'lead';
        }
    };

    const getProposalValue = (proposal: Proposal) => {
        try {
            const data = proposal.calculator_data as { totals?: { monthlyTotal?: number } };
            return data?.totals?.monthlyTotal || 0;
        } catch {
            return 0;
        }
    };

    const getStageTotal = (stageId: string) => {
        return proposals
            .filter(p => (p.pipeline_stage || mapStatusToStage(p.status)) === stageId)
            .reduce((sum, p) => sum + getProposalValue(p), 0);
    };

    const getStageCount = (stageId: string) => {
        return proposals.filter(p => (p.pipeline_stage || mapStatusToStage(p.status)) === stageId).length;
    };

    const filteredProposals = proposals.filter(p =>
        (p.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, proposalId: number) => {
        e.dataTransfer.setData('proposalId', proposalId.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const proposalId = parseInt(e.dataTransfer.getData('proposalId'));
        if (!proposalId) return;

        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;

        const currentCalcData = proposal.calculator_data as any || {};
        const newCalcData = { ...currentCalcData, pipeline_stage: stageId };

        // Optimistic update
        const updatedProposals = proposals.map(p =>
            p.id === proposalId ? { ...p, pipeline_stage: stageId, calculator_data: newCalcData } : p
        );
        setProposals(updatedProposals as Proposal[]);

        try {
            // API call to update stage via calculator_data
            await api.updateProposal(proposalId, { calculator_data: newCalcData });
            toast.success('Stage updated');
        } catch (error) {
            console.error('Failed to update stage:', error);
            toast.error('Failed to update stage');
            loadPipeline(); // Revert on error
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedProposal) {
            const data = selectedProposal.calculator_data as any || {};
            setNotes(data.notes || '');
        }
    }, [selectedProposal]);

    const handleSaveNotes = async () => {
        if (!selectedProposal) return;
        const currentCalcData = selectedProposal.calculator_data as any || {};
        const newCalcData = { ...currentCalcData, notes };

        try {
            await api.updateProposal(selectedProposal.id, { calculator_data: newCalcData });

            // Update local state
            setProposals(proposals.map(p =>
                p.id === selectedProposal.id
                    ? { ...p, calculator_data: newCalcData }
                    : p
            ));

            toast.success('Notes saved');
            setSelectedProposal(null);
        } catch (error) {
            console.error('Failed to save notes:', error);
            toast.error('Failed to save notes');
        }
    };

    const handleCreateContract = async () => {
        if (!selectedProposal) return;
        try {
            const result = await api.createContractFromProposal(selectedProposal.id);
            toast.success('Contract created! Redirecting...');
            setSelectedProposal(null);
            navigate(`/contracts/${result.contract.id}`);
        } catch (error) {
            console.error('Failed to create contract:', error);
            toast.error('Failed to create contract');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C0000]"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="h-screen flex flex-col overflow-hidden bg-gray-50/50">
                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
                            <p className="text-gray-500 mt-1">Track your leads and deals progress</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search deals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64"
                                />
                            </div>
                            <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
                                <Filter className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate('/proposals/new')}
                                className="bg-[#8C0000] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#A00000] transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Deal
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1">Total Pipeline Value</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(proposals.reduce((sum, p) => sum + getProposalValue(p), 0))}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1">Active Deals</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {proposals.filter(p => !['closed_won', 'closed_lost'].includes(p.pipeline_stage || mapStatusToStage(p.status))).length}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1">Won Deals</div>
                            <div className="text-2xl font-bold text-emerald-600">
                                {getStageCount('closed_won')}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1">Avg Deal Size</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(proposals.length > 0 ? proposals.reduce((sum, p) => sum + getProposalValue(p), 0) / proposals.length : 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
                    <div className="flex gap-4 sm:gap-6 h-full min-w-max pb-4">
                        {PIPELINE_STAGES.map(stage => (
                            <div
                                key={stage.id}
                                className="w-64 sm:w-72 lg:w-80 flex flex-col bg-gray-100/50 rounded-xl sm:rounded-2xl border border-gray-200/60 max-h-full"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                {/* Column Header */}
                                <div className={`p-3 sm:p-4 border-b border-gray-200/60 flex items-center justify-between sticky top-0 bg-gray-50/90 backdrop-blur-sm rounded-t-xl sm:rounded-t-2xl z-10`}>
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${stage.color.split(' ')[0].replace('bg-', 'bg-')} flex-shrink-0`}></div>
                                        <h3 className="font-semibold text-gray-700 text-xs sm:text-sm truncate">{stage.label}</h3>
                                        <span className="bg-white px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium text-gray-500 border border-gray-200 flex-shrink-0">
                                            {getStageCount(stage.id)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 ml-2 flex-shrink-0">
                                        {formatCurrency(getStageTotal(stage.id))}
                                    </div>
                                </div>

                                {/* Cards Container */}
                                <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                    {filteredProposals
                                        .filter(p => (p.pipeline_stage || mapStatusToStage(p.status)) === stage.id)
                                        .map(proposal => (
                                            <motion.div
                                                layout
                                                key={proposal.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, proposal.id)}
                                                className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all touch-manipulation"
                                                onClick={() => setSelectedProposal(proposal)}
                                            >
                                                <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                                    <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#8C0000] transition-colors text-xs sm:text-sm pr-2">
                                                        {proposal.client_name}
                                                    </h4>
                                                    <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </button>
                                                </div>

                                                <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 line-clamp-1">
                                                    {proposal.title}
                                                </div>

                                                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                                                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${proposal.calculator_type === 'marketing'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                        }`}>
                                                        {proposal.calculator_type === 'marketing' ? 'Marketing' : 'Custom'}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                        {formatCurrency(getProposalValue(proposal))}
                                                        <span className="text-[10px] sm:text-xs font-normal text-gray-400">/mo</span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-50 text-[10px] sm:text-xs text-gray-400">
                                                    <div className="flex items-center gap-1 sm:gap-1.5" title="Created date">
                                                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                        <span className="truncate">{new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex gap-1.5 sm:gap-2">
                                                        {(proposal.calculator_data as any)?.notes && (
                                                            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8C0000]" />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Modal */}
                {selectedProposal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedProposal.client_name}</h3>
                                    <p className="text-gray-500 text-sm mt-0.5">{selectedProposal.title}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProposal(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Deal Information</label>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Value</span>
                                            <span className="font-semibold text-gray-900">{formatCurrency(getProposalValue(selectedProposal))} /mo</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Stage</span>
                                            <span className="font-medium text-gray-900 capitalize">
                                                {selectedProposal.pipeline_stage?.replace('_', ' ') || 'Lead'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Created</span>
                                            <span className="text-gray-900">{new Date(selectedProposal.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-sm text-gray-700 placeholder:text-gray-400"
                                        placeholder="Add notes about this deal..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => navigate(`/proposals/${selectedProposal.id}/edit`)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View Proposal
                                    </button>
                                    <button
                                        onClick={handleSaveNotes}
                                        className="flex-1 px-4 py-2.5 bg-[#8C0000] hover:bg-[#A00000] text-white rounded-xl font-medium transition-colors"
                                    >
                                        Save Notes
                                    </button>
                                </div>

                                {/* Workflow Actions - Show for Won deals */}
                                {(selectedProposal.pipeline_stage === 'closed_won' || selectedProposal.status === 'accepted') && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Quick Actions</p>
                                        <button
                                            onClick={handleCreateContract}
                                            className="w-full px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-emerald-200"
                                        >
                                            <FileSignature className="w-4 h-4" />
                                            Create Contract from Proposal
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
