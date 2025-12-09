import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import {
    ArrowLeft,
    Save,
    Send,
    Download,
    Eye,
    Loader2,
    FileSignature,
    User,
    CheckCircle,
    Clock,
    AlertCircle,
    Copy,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { SignaturePad } from '../components/SignaturePad';
import { ContractComments } from '../components/ContractComments';
import type { Contract } from '../types/contract';

const statusConfig = {
    draft: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
    sent: { icon: Send, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Sent' },
    viewed: { icon: Eye, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Viewed by Client' },
    signed: { icon: FileSignature, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Client Signed' },
    countersigned: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Countersigned' },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
    cancelled: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Cancelled' },
};

export function ContractEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSignPad, setShowSignPad] = useState(false);

    // Editable fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientAddress, setClientAddress] = useState('');

    useEffect(() => {
        // Handle both 'new' and undefined (from /contracts/new route which doesn't have :id param)
        const isNewContract = id === 'new' || !id;

        if (isNewContract) {
            setContract({
                id: 0,
                user_id: 0,
                status: 'draft',
                title: 'New Contract',
                content: '',
                client_name: '',
                client_email: '',
                deliverables: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            setLoading(false);
        } else {
            loadContract();
        }
    }, [id]);

    const loadContract = async () => {
        try {
            const data = await api.getContract(parseInt(id!));
            setContract(data);
            setTitle(data.title || '');
            setContent(data.content || '');
            setClientName(data.client_name || '');
            setClientCompany(data.client_company || '');
            setClientEmail(data.client_email || '');
            setClientAddress(data.client_address || '');
        } catch (error) {
            toast.error('Failed to load contract');
            navigate('/contracts');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!contract) return;

        // Validation
        if (!clientName.trim()) {
            toast.error('Client name is required');
            return;
        }

        if (!title.trim()) {
            toast.error('Contract title is required');
            return;
        }

        if (!content.trim()) {
            toast.error('Contract content is required');
            return;
        }

        setSaving(true);
        try {
            if (id === 'new') {
                console.log('Creating new contract with data:', {
                    title,
                    client_name: clientName,
                    client_email: clientEmail,
                    content_length: content.length
                });

                const newContract = await api.createContract({
                    title,
                    content,
                    client_name: clientName,
                    client_company: clientCompany,
                    client_email: clientEmail,
                    client_address: clientAddress,
                });

                console.log('Contract created successfully:', newContract);
                toast.success('Contract created successfully!');
                navigate(`/contracts/${newContract.id}`);
            } else {
                console.log('Updating contract:', contract.id);

                await api.updateContract(contract.id, {
                    title,
                    content,
                    client_name: clientName,
                    client_company: clientCompany,
                    client_email: clientEmail,
                    client_address: clientAddress,
                });

                console.log('Contract updated successfully');
                toast.success('Contract saved successfully!');
                loadContract();
            }
        } catch (error) {
            console.error('Failed to save contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to save contract: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        if (!contract) return;
        if (!clientEmail) {
            toast.error('Client email is required to send');
            return;
        }
        setSending(true);
        try {
            await api.sendContract(contract.id);
            toast.success('Contract sent to client!');
            loadContract();
        } catch (error) {
            toast.error('Failed to send contract');
        } finally {
            setSending(false);
        }
    };

    const handleCountersign = async (signatureData: string) => {
        if (!contract) return;
        try {
            await api.countersignContract(contract.id, { signature_data: signatureData });
            toast.success('Contract countersigned! Contract is now complete.');
            setShowSignPad(false);
            loadContract();
        } catch (error) {
            toast.error('Failed to countersign');
        }
    };

    const copySigningLink = async () => {
        if (contract?.access_token) {
            const link = `${window.location.origin}/c/${contract.access_token}`;
            await navigator.clipboard.writeText(link);
            toast.success('Signing link copied!');
        }
    };

    const handleDownloadPdf = async () => {
        if (!contract) return;
        try {
            const blob = await api.generateContractPdf(contract.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/\s+/g, '-')}-contract.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to generate PDF');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
                </div>
            </DashboardLayout>
        );
    }

    if (!contract) return null;

    const status = statusConfig[contract.status];
    const StatusIcon = status.icon;
    const isEditable = ['draft'].includes(contract.status);
    const canSend = contract.status === 'draft' && clientEmail;
    const canCountersign = contract.status === 'signed';

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/contracts')}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{title || 'Untitled Contract'}</h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {status.label}
                                        </span>
                                        {contract.total_value && (
                                            <span className="text-sm text-gray-500">
                                                ${contract.total_value.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {contract.access_token && ['sent', 'viewed'].includes(contract.status) && (
                                    <button
                                        onClick={copySigningLink}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Link
                                    </button>
                                )}

                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>

                                {isEditable && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save
                                    </button>
                                )}

                                {canSend && (
                                    <button
                                        onClick={handleSend}
                                        disabled={sending}
                                        className="flex items-center gap-2 px-5 py-2 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#1d4ed8] disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send to Client
                                    </button>
                                )}

                                {canCountersign && (
                                    <button
                                        onClick={() => setShowSignPad(true)}
                                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                                    >
                                        <FileSignature className="w-4 h-4" />
                                        Countersign
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={!isEditable}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] disabled:bg-gray-50 disabled:text-gray-600"
                                        placeholder="Service Agreement"
                                    />
                                </div>

                                <div className="p-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Content</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        disabled={!isEditable}
                                        rows={30}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] disabled:bg-gray-50 resize-y"
                                        placeholder="Enter contract content..."
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        Supports Markdown formatting. Use **bold**, *italic*, and # headings.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Client Details */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Client Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            disabled={!isEditable}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Company</label>
                                        <input
                                            type="text"
                                            value={clientCompany}
                                            onChange={(e) => setClientCompany(e.target.value)}
                                            disabled={!isEditable}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            disabled={!isEditable}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Address</label>
                                        <textarea
                                            value={clientAddress}
                                            onChange={(e) => setClientAddress(e.target.value)}
                                            disabled={!isEditable}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contract Info */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileSignature className="w-4 h-4" />
                                    Contract Info
                                </h3>
                                <div className="space-y-3 text-sm">
                                    {contract.contract_term && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Term</span>
                                            <span className="font-medium">{contract.contract_term}</span>
                                        </div>
                                    )}
                                    {contract.total_value && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total Value</span>
                                            <span className="font-medium">${contract.total_value.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created</span>
                                        <span className="font-medium">{new Date(contract.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {contract.sent_at && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Sent</span>
                                            <span className="font-medium">{new Date(contract.sent_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {contract.client_signed_at && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Client Signed</span>
                                            <span className="font-medium text-green-600">{new Date(contract.client_signed_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {contract.user_signed_at && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">You Signed</span>
                                            <span className="font-medium text-green-600">{new Date(contract.user_signed_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Signing Link */}
                            {contract.access_token && ['sent', 'viewed', 'signed'].includes(contract.status) && (
                                <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
                                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4" />
                                        Client Signing Link
                                    </h3>
                                    <p className="text-sm text-blue-700 mb-3">
                                        Share this link with your client to sign the contract.
                                    </p>
                                    <button
                                        onClick={copySigningLink}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Signing Link
                                    </button>
                                </div>
                            )}

                            {/* Deliverables */}
                            {contract.deliverables && contract.deliverables.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Deliverables
                                    </h3>
                                    <ul className="space-y-2">
                                        {contract.deliverables.map((d, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium">{d.name}</span>
                                                    {d.price && (
                                                        <span className="text-gray-500 ml-2">
                                                            ${d.price.toLocaleString()}/{d.priceType || 'mo'}
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Comments */}
                            {id !== 'new' && (
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-96 flex flex-col">
                                    <ContractComments contractId={contract.id} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Countersign Modal */}
                {showSignPad && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Countersign Contract</h2>
                            <p className="text-gray-600 mb-6">
                                Draw your signature below to complete the contract.
                            </p>
                            <SignaturePad onSignature={handleCountersign} />
                            <button
                                onClick={() => setShowSignPad(false)}
                                className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
