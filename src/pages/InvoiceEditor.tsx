import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
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
    ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
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
    { id: 'stripe', name: 'Stripe', icon: '💳', color: 'from-indigo-500 to-purple-600' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️', color: 'from-blue-400 to-blue-600' },
    { id: 'square', name: 'Square', icon: '⬛', color: 'from-gray-700 to-gray-900' },
    { id: 'wise', name: 'Wise', icon: '🌐', color: 'from-green-400 to-emerald-600' },
];

export function InvoiceEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

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
    const [milestoneCount, setMilestoneCount] = useState(1);
    const [currentMilestone, setCurrentMilestone] = useState(1);

    useEffect(() => {
        if (id === 'new') {
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
        } else if (id) {
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
        const { subtotal, taxAmount, total } = calculateTotals();

        setSaving(true);
        try {
            if (id === 'new') {
                // Create new invoice
                const newInvoice = await api.createInvoice({
                    title,
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
                    status: 'draft'
                });
                toast.success('Invoice created');
                navigate(`/invoices/${newInvoice.id}`);
            } else {
                // Update existing invoice
                await api.updateInvoice(invoice.id, {
                    title,
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
                });
                toast.success('Invoice saved');
                loadInvoice();
            }
        } catch (error) {
            toast.error('Failed to save invoice');
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
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#3b82f6] hover:bg-red-50 rounded-lg font-medium"
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
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="font-semibold text-gray-900 mb-4">Notes</h2>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={!isEditable}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 resize-none"
                                    placeholder="Payment instructions, thank you note, etc."
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

                            {/* Payment Milestones */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Payment Schedule
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Number of Milestones</label>
                                        <select
                                            value={milestoneCount}
                                            onChange={(e) => setMilestoneCount(parseInt(e.target.value))}
                                            disabled={!isEditable}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                        >
                                            <option value="1">Single Payment</option>
                                            <option value="2">2 Payments (50/50)</option>
                                            <option value="3">3 Payments (33/33/34)</option>
                                            <option value="4">4 Payments (25% each)</option>
                                        </select>
                                    </div>
                                    {milestoneCount > 1 && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">This is Payment</label>
                                            <select
                                                value={currentMilestone}
                                                onChange={(e) => setCurrentMilestone(parseInt(e.target.value))}
                                                disabled={!isEditable}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                                            >
                                                {Array.from({ length: milestoneCount }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>
                                                        Payment {i + 1} of {milestoneCount}
                                                    </option>
                                                ))}
                                            </select>
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
                                        <button
                                            key={platform.id}
                                            onClick={() => isEditable && setSelectedPaymentPlatform(
                                                selectedPaymentPlatform === platform.id ? null : platform.id
                                            )}
                                            disabled={!isEditable}
                                            className={`p-3 rounded-xl border-2 transition-all ${selectedPaymentPlatform === platform.id
                                                ? 'border-[#3b82f6] bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                } disabled:opacity-50`}
                                        >
                                            <div className="text-xl mb-1">{platform.icon}</div>
                                            <div className="text-xs font-medium text-gray-700">{platform.name}</div>
                                        </button>
                                    ))}
                                </div>
                                {selectedPaymentPlatform && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500">
                                            Payment link will be generated when invoice is sent.
                                        </p>
                                    </div>
                                )}
                                {invoice.payment_link && (
                                    <a
                                        href={invoice.payment_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Payment Link
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
