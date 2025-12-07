import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import {
    Plus,
    Search,
    FileSignature,
    Clock,
    Send,
    Eye,
    CheckCircle,
    XCircle,
    MoreVertical,
    Download,
    Trash2,
    ChevronDown,
    PenTool,
    Calendar,
    Loader2,
    FileText,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import type { Contract } from '../types/contract';

const statusConfig = {
    draft: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
    sent: { icon: Send, color: 'text-[#CD8417]', bg: 'bg-[#CD8417]/10', label: 'Sent' },
    viewed: { icon: Eye, color: 'text-[#FFC917]', bg: 'bg-[#FFC917]/10', label: 'Viewed' },
    signed: { icon: PenTool, color: 'text-[#CD8417]', bg: 'bg-[#CD8417]/10', label: 'Signed by Client' },
    countersigned: { icon: CheckCircle, color: 'text-[#8C0000]', bg: 'bg-[#8C0000]/10', label: 'Countersigned' },
    completed: { icon: CheckCircle, color: 'text-[#8C0000]', bg: 'bg-[#8C0000]/10', label: 'Completed' },
    cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Cancelled' },
};

export function ContractsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => {
        loadContracts();
    }, [statusFilter]);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadContracts = async () => {
        setLoading(true);
        try {
            const data = await api.getContracts({ status: statusFilter !== 'all' ? statusFilter : undefined });
            setContracts(data.contracts || []);
        } catch (error) {
            console.error('Failed to load contracts:', error);
            toast.error('Failed to load contracts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this contract?')) return;
        try {
            await api.deleteContract(id);
            setContracts(contracts.filter(c => c.id !== id));
            toast.success('Contract deleted');
        } catch (error) {
            toast.error('Failed to delete contract');
        }
    };

    const handleSend = async (id: number) => {
        try {
            await api.sendContract(id);
            loadContracts();
            toast.success('Contract sent to client');
        } catch (error) {
            toast.error('Failed to send contract');
        }
    };

    const copySigningLink = async (contract: Contract) => {
        if (contract.access_token) {
            const link = `${window.location.origin}/c/${contract.access_token}`;
            await navigator.clipboard.writeText(link);
            toast.success('Signing link copied!');
        }
    };

    const handleDownloadPdf = async (contract: Contract) => {
        try {
            const blob = await api.generateContractPdf(contract.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contract-${contract.id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    const filteredContracts = contracts.filter(contract =>
        contract.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingSignature = contracts.filter(c => ['sent', 'viewed'].includes(c.status)).length;
    const signedCount = contracts.filter(c => ['signed', 'countersigned', 'completed'].includes(c.status)).length;

    return (
        <DashboardLayout>
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contracts</h1>
                        <p className="text-gray-500 mt-1">Send contracts for e-signature</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/templates')}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Templates
                        </button>
                        <button
                            onClick={() => navigate('/contracts/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#8C0000] text-white rounded-xl font-medium hover:bg-[#A00000] transition-colors shadow-lg shadow-[#8C0000]/20"
                        >
                            <Plus className="w-5 h-5" />
                            Create Contract
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFC917]/10 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-[#FFC917]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Awaiting Signature</p>
                                <p className="text-xl font-bold text-gray-900">{pendingSignature}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#8C0000]/10 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-[#8C0000]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Signed</p>
                                <p className="text-xl font-bold text-gray-900">{signedCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FAF3CD] rounded-xl flex items-center justify-center">
                                <FileSignature className="w-5 h-5 text-[#CD8417]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Contracts</p>
                                <p className="text-xl font-bold text-gray-900">{contracts.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 md:max-w-xs group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search contracts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8C0000]/10 focus:border-[#8C0000] transition-all outline-none text-sm"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="viewed">Viewed</option>
                                <option value="signed">Signed</option>
                                <option value="completed">Completed</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Contract List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#8C0000]" />
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileSignature className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
                        <p className="text-gray-500 mb-6">Create your first contract or adjust your filters</p>
                        <button
                            onClick={() => navigate('/contracts/new')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8C0000] text-white rounded-xl font-medium hover:bg-[#A00000] transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Contract
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contract</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Client</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Value</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Created</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {filteredContracts.map((contract) => {
                                        const status = statusConfig[contract.status];
                                        const StatusIcon = status.icon;

                                        return (
                                            <motion.tr
                                                key={contract.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{contract.title}</div>
                                                    {contract.contract_term && (
                                                        <div className="text-xs text-gray-500">{contract.contract_term}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{contract.client_name}</div>
                                                    {contract.client_company && (
                                                        <div className="text-sm text-gray-500">{contract.client_company}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {contract.total_value ? (
                                                        <div className="font-semibold text-gray-900">
                                                            ${contract.total_value.toLocaleString()}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(contract.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenu(activeMenu === contract.id ? null : contract.id);
                                                            }}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {activeMenu === contract.id && (
                                                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 min-w-[180px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/contracts/${contract.id}`);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    View / Edit
                                                                </button>
                                                                {contract.status === 'draft' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSend(contract.id);
                                                                            setActiveMenu(null);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm text-[#CD8417] hover:bg-[#FAF3CD]/50 flex items-center gap-2"
                                                                    >
                                                                        <Send className="w-4 h-4" />
                                                                        Send for Signature
                                                                    </button>
                                                                )}
                                                                {contract.access_token && ['sent', 'viewed'].includes(contract.status) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            copySigningLink(contract);
                                                                            setActiveMenu(null);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                        Copy Signing Link
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadPdf(contract);
                                                                        setActiveMenu(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    Download PDF
                                                                </button>
                                                                <div className="h-px bg-gray-100 my-1" />
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(contract.id);
                                                                        setActiveMenu(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default ContractsPage;
