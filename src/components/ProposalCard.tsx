import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Share2,
    DollarSign,
    Calendar,
    FileText,
    Receipt,
    FileSignature
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface Proposal {
    id: number;
    title: string;
    client_name: string;
    client_company?: string;
    calculator_type: 'vmg' | 'marine' | 'marketing' | 'custom';
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    calculator_data: any;
    created_at: string;
    view_count?: number;
    cover_photo_url?: string;
}

interface ProposalCardProps {
    proposal: Proposal;
    onDelete: (id: number) => void;
    onShare: (id: number) => void;
}

const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
    sent: { color: 'bg-blue-50 text-blue-700', label: 'Sent' },
    viewed: { color: 'bg-purple-50 text-purple-700', label: 'Viewed' },
    accepted: { color: 'bg-emerald-50 text-emerald-700', label: 'Accepted' },
    rejected: { color: 'bg-red-50 text-red-700', label: 'Rejected' }
};

export function ProposalCard({ proposal, onDelete, onShare }: ProposalCardProps) {
    const navigate = useNavigate();
    const toast = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [generating, setGenerating] = useState(false);
    const status = statusConfig[proposal.status];

    const getProposalValue = () => {
        try {
            return proposal.calculator_data?.totals?.monthlyTotal || 0;
        } catch {
            return 0;
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/proposals/${proposal.id}/edit`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(proposal.id);
        setShowMenu(false);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        onShare(proposal.id);
        setShowMenu(false);
    };

    const handleGenerateInvoice = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setGenerating(true);
        try {
            await api.generateInvoiceFromProposal(proposal.id);
            toast.success('Invoice created successfully!');
            navigate('/invoices');
        } catch (error) {
            toast.error('Failed to generate invoice');
        } finally {
            setGenerating(false);
            setShowMenu(false);
        }
    };

    const handleGenerateContract = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setGenerating(true);
        try {
            const result = await api.generateContractFromProposal(proposal.id);
            toast.success('Contract created successfully!');
            navigate(`/contracts/${result.id}/edit`);
        } catch (error) {
            toast.error('Failed to generate contract');
        } finally {
            setGenerating(false);
            setShowMenu(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="group bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
        >
            {/* Cover Photo Area */}
            <div className="relative h-40 bg-gray-50 overflow-hidden group-hover:opacity-95 transition-opacity">
                {proposal.cover_photo_url ? (
                    <img
                        src={proposal.cover_photo_url}
                        alt={proposal.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50/50">
                        <FileText className="w-12 h-12 text-gray-200" />
                    </div>
                )}

                {/* Status Badge - Floating */}
                <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-transparent backdrop-blur-sm ${status.color}`}>
                        {status.label}
                    </span>
                </div>

                {/* Quick Actions - Visible on Hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-sm hover:bg-white text-gray-600 transition-colors border border-gray-100"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-1.5 z-20 min-w-[180px] transform origin-top-right">
                            <button
                                onClick={handleEdit}
                                className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Edit Proposal
                            </button>
                            <button
                                onClick={handleShare}
                                className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Share Link
                            </button>

                            {proposal.status === 'accepted' && (
                                <>
                                    <div className="h-px bg-gray-100 my-1.5" />
                                    <button
                                        onClick={handleGenerateInvoice}
                                        disabled={generating}
                                        className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <Receipt className="w-3.5 h-3.5" />
                                        {generating ? 'Creating...' : 'Generate Invoice'}
                                    </button>
                                    <button
                                        onClick={handleGenerateContract}
                                        disabled={generating}
                                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <FileSignature className="w-3.5 h-3.5" />
                                        {generating ? 'Creating...' : 'Generate Contract'}
                                    </button>
                                </>
                            )}

                            <div className="h-px bg-gray-50 my-1.5" />
                            <button
                                onClick={handleDelete}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5">
                <div className="mb-4">
                    <h3 className="font-semibold text-base text-gray-900 truncate mb-1" title={proposal.title}>
                        {proposal.title || 'Untitled Proposal'}
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate max-w-[60%]">
                            {proposal.client_name}
                        </p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${proposal.calculator_type === 'vmg'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : proposal.calculator_type === 'marine'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                            {proposal.calculator_type === 'vmg' ? 'Marketing' : proposal.calculator_type === 'marine' ? 'Marine' : 'Custom'}
                        </span>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                            {getProposalValue().toLocaleString()}
                            <span className="text-xs font-normal text-gray-400 ml-0.5">/mo</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {proposal.view_count !== undefined && proposal.view_count > 0 && (
                            <div className="flex items-center gap-1 text-gray-400" title="Views">
                                <Eye className="w-3 h-3" />
                                <span className="text-xs font-medium">{proposal.view_count}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-400" title="Created date">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs font-medium">
                                {new Date(proposal.created_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
