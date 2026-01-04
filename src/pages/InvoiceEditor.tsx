import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ClientSelector } from '../components/ClientSelector';
import {
    ArrowLeft,
    Save,
    Send,
    Download,
    Loader2,
    User,
    CheckCircle,
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    DollarSign,
    CreditCard,
    ExternalLink,
    FileText,
    X,
    ScanLine,
    ChevronDown,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import type { Invoice, InvoiceLineItem } from '../types/invoice';

const statusConfig = {
    draft: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
    sent: { icon: Send, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Sent' },
    viewed: { icon: User, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Viewed' },
    paid: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Paid' },
    overdue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Overdue' },
    cancelled: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Cancelled' },
};

const PAYMENT_PLATFORMS = [
    { id: 'payment_link', name: 'Payment Link', icon: '🔗', color: 'from-gray-500 to-gray-700' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', color: 'from-emerald-500 to-teal-700' },
    { id: 'stripe', name: 'Stripe', icon: '💳', color: 'from-indigo-500 to-purple-600' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️', color: 'from-blue-400 to-blue-600' },
    { id: 'square', name: 'Square', icon: '⬛', color: 'from-gray-700 to-gray-900' },
    { id: 'wise', name: 'Wise', icon: '🌐', color: 'from-green-400 to-emerald-600' },
];

const BankDetailsModal = ({
    isOpen,
    onClose,
    initialData,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSave: (details: any) => Promise<void>;
}) => {
    const [details, setDetails] = useState(initialData || {
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        swiftBic: '',
        iban: '',
        address: ''
    });
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        if (initialData) setDetails(initialData);
    }, [initialData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(details);
            onClose();
        } catch (error) {
            console.error('Failed to save bank details', error);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation for image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG)');
            return;
        }

        setScanning(true);
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;

                // Call API
                const response = await api.extractBankDetails(base64);
                if (response && response.details) {
                    setDetails((prev: any) => ({
                        ...prev,
                        ...response.details
                    }));
                }
                setScanning(false);
            };
        } catch (error) {
            console.error('Scan failed', error);
            alert('Failed to scan image. Please try again.');
            setScanning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-semibold text-lg">Bank Account Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* AI Upload Section */}
                    <div className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900">Auto-fill from Image</h4>
                                <p className="text-xs text-blue-700 mt-0.5">Upload a screenshot of your bank details</p>
                            </div>
                            <label className={`
                                px-3 py-1.5 bg-white text-blue-600 text-xs font-medium rounded-lg border border-blue-200 
                                shadow-sm cursor-pointer hover:bg-blue-50 transition-colors
                                ${scanning ? 'opacity-50 pointer-events-none' : ''}
                            `}>
                                {scanning ? 'Scanning...' : 'Upload Image'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={scanning}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Bank Name</label>
                            <input
                                type="text"
                                value={details.bankName}
                                onChange={e => setDetails({ ...details, bankName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Chase Bank"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Account Holder</label>
                            <input
                                type="text"
                                value={details.accountName}
                                onChange={e => setDetails({ ...details, accountName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Acme Inc"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Account Number</label>
                            <input
                                type="text"
                                value={details.accountNumber}
                                onChange={e => setDetails({ ...details, accountNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Routing / Sort</label>
                            <input
                                type="text"
                                value={details.routingNumber}
                                onChange={e => setDetails({ ...details, routingNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">SWIFT / BIC</label>
                            <input
                                type="text"
                                value={details.swiftBic}
                                onChange={e => setDetails({ ...details, swiftBic: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">IBAN</label>
                            <input
                                type="text"
                                value={details.iban}
                                onChange={e => setDetails({ ...details, iban: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-shrink-0 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving || scanning}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save & Use'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const TERMS_TEMPLATES = [
    {
        id: 'standard',
        name: 'Standard Terms',
        description: 'Standard payment terms for general services',
        content: `1. Payment is due within 14 days of invoice date.
2. Late payments may incur a fee of 1.5% per month.
3. Please include the invoice number on your payment.`
    },
    {
        id: 'professional',
        name: 'Professional Services',
        description: 'Detailed terms for professional engagements',
        content: `1. Payment Due: Net 30 days.
2. Services will be suspended if payment is more than 15 days overdue.
3. All intellectual property rights remain with the provider until full payment is received.`
    },
    {
        id: 'retainer',
        name: 'Retainer Agreement',
        description: 'Terms specifically for retainer based billing',
        content: `1. This invoice covers the retainer period for the upcoming month.
2. Payment is required prior to the start of the service period.
3. Unused hours do not rollover to the next month.`
    }
];

function TemplateSelector({ onSelect }: { onSelect: (content: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
            >
                <FileText className="w-3.5 h-3.5" />
                Templates
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select a Template</h4>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                            {TERMS_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        onSelect(template.content);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm text-gray-900 group-hover:text-blue-600">{template.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export function InvoiceEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();


    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);

    // Editable fields
    const [title, setTitle] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
    const [taxRate, setTaxRate] = useState(0);

    // Payment settings
    const [selectedPaymentPlatform, setSelectedPaymentPlatform] = useState<string | null>(null);
    const [paymentLink, setPaymentLink] = useState('');
    const [milestoneCount, setMilestoneCount] = useState(1);
    const [currentMilestone, setCurrentMilestone] = useState(1);
    const [showBankModal, setShowBankModal] = useState(false); // Add modal state

    // Contracts
    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

    // Client
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        try {
            const response = await api.getContracts();
            if (response && response.contracts) {
                setContracts(response.contracts);
            }
        } catch (error) {
            console.error('Failed to load contracts:', error);
        }
    };

    useEffect(() => {
        // Handle both 'new' and undefined (from /invoices/new route which doesn't have :id param)
        const isNewInvoice = id === 'new' || !id;

        if (isNewInvoice) {
            setInvoice({
                id: 0, // Placeholder
                user_id: 0,
                invoice_number: 'DRAFT',
                client_name: '',
                client_email: '',
                status: 'draft',
                title: 'New Invoice',
                line_items: [],
                currency: 'USD',
                payment_terms: 'due_on_receipt',
                tax_rate: 0,
                tax_amount: 0,
                subtotal: 0,
                total: 0,
                milestone_number: 1,
                milestone_total: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            setLoading(false);
        } else {
            loadInvoice();
        }
    }, [id]);

    const loadInvoice = async () => {
        try {
            const data = await api.getInvoice(parseInt(id!));
            setInvoice(data);
            setTitle(data.title || '');
            setClientName(data.client_name || '');
            setClientEmail(data.client_email || '');
            setClientCompany(data.client_company || '');
            setClientAddress(data.client_address || '');
            setDueDate(data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : '');
            setNotes(data.notes || '');
            setLineItems(data.line_items || []);
            setTaxRate(data.tax_rate || 0);
            setMilestoneCount(data.milestone_total || 1);
            setCurrentMilestone(data.milestone_number || 1);
            setSelectedPaymentPlatform(data.payment_platform || null);
            setPaymentLink(data.payment_link || '');
            setSelectedContractId(data.contract_id || null);
        } catch (error) {
            toast.error('Failed to load invoice');
            navigate('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    };

    const addLineItem = () => {
        setLineItems([...lineItems, {
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: 0,
        }]);
    };

    const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        // Auto-calculate amount
        updated[index].amount = updated[index].quantity * updated[index].unit_price;
        setLineItems(updated);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!invoice) return;

        // Validation
        if (!clientName.trim()) {
            toast.error('Client name is required');
            return;
        }

        if (lineItems.length === 0) {
            toast.error('Please add at least one line item');
            return;
        }

        // Validate line items
        const invalidItems = lineItems.filter(item =>
            !item.description.trim() || item.quantity <= 0 || item.unit_price < 0
        );
        if (invalidItems.length > 0) {
            toast.error('Please fill in all line item details with valid values');
            return;
        }

        const { subtotal, taxAmount, total } = calculateTotals();

        setSaving(true);
        try {
            if (id === 'new') {
                // Create new invoice


                const newInvoice = await api.createInvoice({
                    title,
                    client_id: selectedClientId || undefined,
                    client_name: clientName,
                    client_email: clientEmail,
                    client_company: clientCompany,
                    client_address: clientAddress,
                    due_date: dueDate || null,
                    notes,
                    line_items: lineItems,
                    tax_rate: taxRate,
                    tax_amount: taxAmount,
                    subtotal,
                    total,
                    milestone_number: currentMilestone,
                    milestone_total: milestoneCount,
                    payment_platform: selectedPaymentPlatform,
                    payment_link: paymentLink,
                    contract_id: selectedContractId || undefined,
                    status: 'draft'
                });


                toast.success('Invoice created successfully!');
                navigate(`/invoices/${newInvoice.id}`);
            } else {
                // Update existing invoice


                await api.updateInvoice(invoice.id, {
                    title,
                    client_id: selectedClientId || undefined,
                    client_name: clientName,
                    contract_id: selectedContractId || undefined,
                    client_email: clientEmail,
                    client_company: clientCompany,
                    client_address: clientAddress,
                    due_date: dueDate || null,
                    notes,
                    line_items: lineItems,
                    tax_rate: taxRate,
                    tax_amount: taxAmount,
                    subtotal,
                    total,
                    milestone_number: currentMilestone,
                    milestone_total: milestoneCount,
                    payment_platform: selectedPaymentPlatform,
                    payment_link: paymentLink,
                });


                toast.success('Invoice saved successfully!');
                loadInvoice();
            }
        } catch (error) {
            console.error('Failed to save invoice:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to save invoice: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        if (!invoice || !clientEmail) {
            toast.error('Client email is required');
            return;
        }

        setSending(true);
        try {
            await api.sendInvoice(invoice.id);
            toast.success('Invoice sent to client!');
            loadInvoice();
        } catch (error) {
            toast.error('Failed to send invoice');
        } finally {
            setSending(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!invoice) return;
        try {
            const blob = await api.generateInvoicePdf(invoice.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice-${invoice.invoice_number}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to generate PDF');
        }
    };

    const handleMarkAsPaid = async () => {
        if (!invoice) return;
        try {
            await api.updateInvoiceStatus(invoice.id, 'paid');
            toast.success('Invoice marked as paid');
            loadInvoice();
        } catch (error) {
            toast.error('Failed to update invoice');
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

    if (!invoice) return null;

    const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.draft;
    const StatusIcon = status.icon;
    const isEditable = ['draft'].includes(invoice.status);
    const { subtotal, taxAmount, total } = calculateTotals();

    return (
        <DashboardLayout disablePadding>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header - Moved to be direct sticky child */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/invoices')}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-xl font-bold text-gray-900">
                                            Invoice #{invoice.invoice_number}
                                        </h1>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {status.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {clientName} • Total: ${total.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
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

                                {invoice.status === 'sent' && (
                                    <button
                                        onClick={handleMarkAsPaid}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Paid
                                    </button>
                                )}

                                {isEditable && clientEmail && (
                                    <button
                                        onClick={handleSend}
                                        disabled={sending}
                                        className="flex items-center gap-2 px-5 py-2 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#1d4ed8] disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send Invoice
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Invoice Details */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="font-semibold text-gray-900 mb-4">Invoice Details</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm text-gray-600 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            disabled={!isEditable}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50"
                                            placeholder="Invoice title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            disabled={!isEditable}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                            disabled={!isEditable}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900">Line Items</h2>
                                    {isEditable && (
                                        <button
                                            onClick={addLineItem}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#3b82f6] hover:bg-blue-50 rounded-lg font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Item
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {/* Header */}
                                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                                        <div className="col-span-5">Description</div>
                                        <div className="col-span-2 text-center">Qty</div>
                                        <div className="col-span-2 text-right">Unit Price</div>
                                        <div className="col-span-2 text-right">Amount</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {lineItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-5">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    disabled={!isEditable}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                                    placeholder="Service description"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    disabled={!isEditable}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center disabled:bg-gray-50"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    disabled={!isEditable}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right disabled:bg-gray-50"
                                                />
                                            </div>
                                            <div className="col-span-2 text-right font-medium text-gray-900">
                                                ${(item.quantity * item.unit_price).toLocaleString()}
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                {isEditable && (
                                                    <button
                                                        onClick={() => removeLineItem(index)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {lineItems.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No line items yet</p>
                                            {isEditable && (
                                                <button
                                                    onClick={addLineItem}
                                                    className="mt-2 text-sm text-[#3b82f6] hover:underline"
                                                >
                                                    Add your first item
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Totals */}
                                {lineItems.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-medium">${subtotal.toLocaleString()}</span>
                                        </div>
                                        {taxRate > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tax ({taxRate}%)</span>
                                                <span className="font-medium">${taxAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                            <span>Total</span>
                                            <span className="text-[#3b82f6]">${total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Terms & Conditions
                                    </h3>
                                    {isEditable && (
                                        <TemplateSelector onSelect={setNotes} />
                                    )}
                                </div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={!isEditable}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 resize-y min-h-[100px]"
                                    placeholder="Enter terms and conditions, payment instructions, or other notes..."
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Client Details */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Bill To
                                </h3>
                                <div className="space-y-4">
                                    {/* Contract Selector */}
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Link to Contract (Optional)</label>
                                        <select
                                            value={selectedContractId || ''}
                                            onChange={(e) => {
                                                const contractId = e.target.value ? parseInt(e.target.value) : null;
                                                setSelectedContractId(contractId);
                                                // Optional: auto-fill client details from contract if selected
                                                if (contractId) {
                                                    const contract = contracts.find(c => c.id === contractId);
                                                    if (contract) {
                                                        setClientName(contract.client_name);
                                                        setClientEmail(contract.client_email || '');
                                                        setClientCompany(contract.client_company || '');
                                                    }
                                                }
                                            }}
                                            disabled={!isEditable}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                        >
                                            <option value="">No Contract Linked</option>
                                            {contracts.map(contract => (
                                                <option key={contract.id} value={contract.id}>
                                                    {contract.title} ({new Date(contract.created_at).toLocaleDateString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Client Selector */}
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Client</label>
                                        <ClientSelector
                                            selectedClientId={selectedClientId}
                                            clientName={clientName}
                                            clientEmail={clientEmail}
                                            clientCompany={clientCompany}
                                            clientAddress={clientAddress}
                                            onClientSelect={(client) => {
                                                setSelectedClientId(client?.id || null);
                                            }}
                                            onClientDataChange={(data) => {
                                                setClientName(data.name);
                                                setClientEmail(data.email);
                                                setClientCompany(data.company);
                                                setClientAddress(data.address);
                                            }}
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

                            {/* Payment Milestones */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Payment Schedule
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm text-gray-600 mb-1">Number of Milestones</label>
                                        <div className="relative">
                                            <select
                                                value={milestoneCount}
                                                onChange={(e) => setMilestoneCount(parseInt(e.target.value))}
                                                disabled={!isEditable}
                                                className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            >
                                                <option value="1">Single Payment</option>
                                                <option value="2">2 Payments (50/50)</option>
                                                <option value="3">3 Payments (33/33/34)</option>
                                                <option value="4">4 Payments (25% each)</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    {milestoneCount > 1 && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">This is Payment</label>
                                            <div className="relative">
                                                <select
                                                    value={currentMilestone}
                                                    onChange={(e) => setCurrentMilestone(parseInt(e.target.value))}
                                                    disabled={!isEditable}
                                                    className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                >
                                                    {Array.from({ length: milestoneCount }, (_, i) => (
                                                        <option key={i + 1} value={i + 1}>
                                                            Payment {i + 1} of {milestoneCount}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400">
                                        {milestoneCount > 1
                                            ? `This is payment ${currentMilestone} of ${milestoneCount}`
                                            : 'Full payment in single invoice'}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Platforms */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Payment Method
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {PAYMENT_PLATFORMS.map(platform => (
                                        <div
                                            key={platform.id}
                                            onClick={() => {
                                                if (!isEditable) return;
                                                const isSelected = selectedPaymentPlatform === platform.id;
                                                const nextPlatform = isSelected ? null : platform.id;
                                                setSelectedPaymentPlatform(nextPlatform);

                                                if (nextPlatform === 'bank') {
                                                    if (user?.bank_details && Object.values(user.bank_details).some(v => v)) {
                                                        const { bankName, accountName, accountNumber, routingNumber, swiftBic, iban } = user.bank_details;
                                                        const bankText = `Bank Transfer Details:\nBank: ${bankName || ''}\nAccount Name: ${accountName || ''}\nAccount No: ${accountNumber || ''}\nRouting/Sort Code: ${routingNumber || ''}\nSWIFT/BIC: ${swiftBic || ''}\nIBAN: ${iban || ''}`;
                                                        setNotes(prev => prev ? prev + '\n\n' + bankText : bankText);
                                                        toast.success('Bank details added to notes');
                                                    } else {
                                                        setShowBankModal(true);
                                                    }
                                                }
                                                else if (nextPlatform && user?.payment_preferences) {
                                                    const prefs = user.payment_preferences;
                                                    if (nextPlatform === 'payment_link' && prefs.manualLink) {
                                                        setPaymentLink(prefs.manualLink);
                                                    } else if (nextPlatform === 'stripe' && prefs.stripeLink) {
                                                        setPaymentLink(prefs.stripeLink);
                                                    } else if (nextPlatform === 'paypal' && prefs.paypalLink) {
                                                        setPaymentLink(prefs.paypalLink);
                                                    }
                                                }
                                            }}
                                            className={`
                                                    cursor-pointer relative overflow-hidden rounded-xl border transition-all duration-200 group
                                                    ${selectedPaymentPlatform === platform.id
                                                    ? 'border-blue-500 ring-1 ring-blue-500 shadow-md bg-blue-50/10'
                                                    : 'border-gray-200 hover:border-blue-200 hover:shadow-sm bg-white'
                                                }
                                                `}
                                        >
                                            <div className="p-4 flex flex-col items-center justify-center gap-3 aspect-square">
                                                <div className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm
                                                        bg-gradient-to-br ${platform.color} text-white
                                                    `}>
                                                    {platform.icon}
                                                </div>
                                                <span className={`text-xs font-medium text-center ${selectedPaymentPlatform === platform.id ? 'text-blue-700' : 'text-gray-600'
                                                    }`}>
                                                    {platform.name}
                                                </span>
                                                {platform.id === 'bank' && !user?.bank_details?.accountNumber && (
                                                    <span className="text-[10px] text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                                                        Setup Needed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedPaymentPlatform && selectedPaymentPlatform !== 'bank' && (
                                    <div className="mt-4">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Payment Link
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="url"
                                                value={paymentLink}
                                                onChange={(e) => setPaymentLink(e.target.value)}
                                                disabled={!isEditable}
                                                placeholder="https://..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                                            />
                                            {paymentLink && (
                                                <a
                                                    href={paymentLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-500 hover:text-[#3b82f6] hover:bg-blue-50 rounded-lg"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Bank Details Modal */}
            <BankDetailsModal
                isOpen={showBankModal}
                onClose={() => setShowBankModal(false)}
                initialData={user?.bank_details}
                onSave={async (details) => {
                    await api.updateProfile({ bank_details: details });
                    // After saving, update the notes with the new bank details
                    const { bankName, accountName, accountNumber, routingNumber, swiftBic, iban } = details;
                    const bankText = `Bank Transfer Details:\nBank: ${bankName || ''}\nAccount Name: ${accountName || ''}\nAccount No: ${accountNumber || ''}\nRouting/Sort Code: ${routingNumber || ''}\nSWIFT/BIC: ${swiftBic || ''}\nIBAN: ${iban || ''}`;
                    setNotes(prev => prev ? prev + '\n\n' + bankText : bankText);
                    toast.success('Bank details saved and added to notes');
                    // Optionally, refresh user context if it doesn't auto-update
                    // For now assuming api.updateProfile might trigger a re-fetch or we reload page? 
                    // Better to just proceed as is.
                }}
            />
        </DashboardLayout>
    );
}
