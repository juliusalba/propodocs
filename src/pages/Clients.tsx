import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { api } from '../lib/api';
import {
    Search, Plus, MoreVertical, Mail, Phone, Building2,
    MapPin, FileText, Receipt, FileSignature, Trash2,
    Users as UsersIcon, DollarSign, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

interface Client {
    id: number;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
    notes?: string;
    tags?: string[];
    status: string;
    total_revenue: number;
    proposal_count: number;
    contract_count: number;
    invoice_count: number;
    created_at: string;
    updated_at: string;
}

export function Clients() {
    const navigate = useNavigate();
    const toast = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        loadClients();
    }, [statusFilter]);

    const loadClients = async () => {
        try {
            const data = await api.getClients({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchQuery || undefined
            });
            setClients(data.clients || []);
        } catch (error) {
            console.error('Failed to load clients:', error);
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setLoading(true);
        loadClients();
    };

    const handleCreateClient = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        try {
            await api.createClient(formData);
            toast.success('Client created successfully');
            setShowCreateModal(false);
            setFormData({ name: '', email: '', company: '', phone: '', address: '', notes: '' });
            loadClients();
        } catch (error) {
            console.error('Failed to create client:', error);
            toast.error('Failed to create client');
        }
    };

    const handleDeleteClient = async (id: number) => {
        if (!confirm('Are you sure you want to delete this client?')) return;

        try {
            await api.deleteClient(id);
            toast.success('Client deleted');
            setSelectedClient(null);
            loadClients();
        } catch (error) {
            console.error('Failed to delete client:', error);
            toast.error('Failed to delete client');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div className="min-h-screen bg-gray-50/50">
                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
                            <p className="text-gray-500 mt-1">Manage your client relationships</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#8C0000] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#A00000] transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Client
                        </button>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <UsersIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Total Clients</div>
                                    <div className="text-xl font-bold text-gray-900">{clients.length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Total Revenue</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formatCurrency(clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Total Proposals</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {clients.reduce((sum, c) => sum + (c.proposal_count || 0), 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <FileSignature className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Active Contracts</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {clients.reduce((sum, c) => sum + (c.contract_count || 0), 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client List */}
                <div className="p-8">
                    {filteredClients.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h3>
                            <p className="text-gray-500 mb-6">Start building your client relationships</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-[#8C0000] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#A00000] transition-colors inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Your First Client
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <AnimatePresence>
                                        {filteredClients.map((client) => (
                                            <motion.tr
                                                key={client.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedClient(client)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8C0000] to-[#500000] flex items-center justify-center text-white font-semibold">
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{client.name}</div>
                                                            {client.company && (
                                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                                    <Building2 className="w-3 h-3" />
                                                                    {client.company}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {client.email && (
                                                            <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                                {client.email}
                                                            </div>
                                                        )}
                                                        {client.phone && (
                                                            <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="flex items-center gap-1 text-purple-600">
                                                            <FileText className="w-4 h-4" />
                                                            {client.proposal_count || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <FileSignature className="w-4 h-4" />
                                                            {client.contract_count || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-blue-600">
                                                            <Receipt className="w-4 h-4" />
                                                            {client.invoice_count || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-emerald-600">
                                                        {formatCurrency(client.total_revenue)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : client.status === 'inactive'
                                                                ? 'bg-gray-100 text-gray-600'
                                                                : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        {client.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedClient(client);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create Client Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Add New Client</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Client name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Company name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="123 Main St, City, Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none h-20"
                                        placeholder="Additional notes about this client..."
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateClient}
                                    className="flex-1 px-4 py-2.5 bg-[#8C0000] hover:bg-[#A00000] text-white rounded-xl font-medium transition-colors"
                                >
                                    Create Client
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Client Detail Modal */}
                {selectedClient && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8C0000] to-[#500000] flex items-center justify-center text-white text-xl font-bold">
                                        {selectedClient.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedClient.name}</h3>
                                        {selectedClient.company && (
                                            <p className="text-gray-500 flex items-center gap-1">
                                                <Building2 className="w-4 h-4" />
                                                {selectedClient.company}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedClient(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Contact Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedClient.email && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Email</div>
                                                <div className="text-sm font-medium text-gray-900">{selectedClient.email}</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedClient.phone && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Phone</div>
                                                <div className="text-sm font-medium text-gray-900">{selectedClient.phone}</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedClient.address && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl col-span-2">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Address</div>
                                                <div className="text-sm font-medium text-gray-900">{selectedClient.address}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedClient.total_revenue)}</div>
                                        <div className="text-xs text-gray-500 mt-1">Total Revenue</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                                        <div className="text-2xl font-bold text-purple-600">{selectedClient.proposal_count || 0}</div>
                                        <div className="text-xs text-gray-500 mt-1">Proposals</div>
                                    </div>
                                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                                        <div className="text-2xl font-bold text-amber-600">{selectedClient.contract_count || 0}</div>
                                        <div className="text-xs text-gray-500 mt-1">Contracts</div>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                                        <div className="text-2xl font-bold text-blue-600">{selectedClient.invoice_count || 0}</div>
                                        <div className="text-xs text-gray-500 mt-1">Invoices</div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedClient.notes && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl">{selectedClient.notes}</p>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => navigate('/proposals/new')}
                                        className="flex-1 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        New Proposal
                                    </button>
                                    <button
                                        onClick={() => navigate('/invoices/new')}
                                        className="flex-1 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Receipt className="w-4 h-4" />
                                        New Invoice
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(selectedClient.id)}
                                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
