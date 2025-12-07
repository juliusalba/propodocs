import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  Mail,
  Phone,
  Users,
  Eye,
  Download,
  X,
  MoreVertical,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown
} from 'lucide-react';
import { api } from '../../lib/api';
import { ClientDetailsForm, type ClientDetails } from '../ClientDetailsForm';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { useToast } from '../Toast';

interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  last_contact?: string;
  status: 'active' | 'inactive' | 'prospect';
  total_proposals: number;
  accepted_proposals: number;
  total_value: number;
}

interface ClientManagementProps {
  onClose?: () => void;
  onSelectClient?: (client: Client) => void;
}

export function ClientManagement({ onClose, onSelectClient }: ClientManagementProps) {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // New client form state
  const [newClient, setNewClient] = useState<ClientDetails>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      // Get all proposals and extract unique clients
      const proposalsData = await api.getProposals();
      const proposals = proposalsData.proposals || [];

      const clientMap = new Map<string, Client>();

      proposals.forEach((proposal: any) => {
        const clientKey = `${proposal.client_email || ''}-${proposal.client_name || ''}`;
        if (clientKey && !clientMap.has(clientKey)) {
          const client: Client = {
            id: clientMap.size + 1,
            name: proposal.client_name || 'Unknown',
            company: proposal.client_company || '',
            email: proposal.client_email || '',
            phone: proposal.client_phone || '',
            address: proposal.client_address || '',
            created_at: proposal.created_at,
            last_contact: proposal.updated_at,
            status: 'active',
            total_proposals: 0,
            accepted_proposals: 0,
            total_value: 0
          };
          clientMap.set(clientKey, client);
        }

        // Update client stats
        if (clientMap.has(clientKey)) {
          const client = clientMap.get(clientKey)!;
          client.total_proposals++;
          if (proposal.status === 'accepted') {
            client.accepted_proposals++;
          }

          // Calculate total value from calculator_data
          const data = proposal.calculator_data;
          if (data?.totals?.monthlyTotal) {
            client.total_value += data.totals.monthlyTotal;
          }
        }
      });

      setClients(Array.from(clientMap.values()));
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      toast.error('Client name is required');
      return;
    }

    try {
      // Create a demo client record (in a real app, this would save to database)
      const client: Client = {
        id: Date.now(),
        name: newClient.name,
        company: newClient.company,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        created_at: new Date().toISOString(),
        last_contact: new Date().toISOString(),
        status: 'prospect',
        total_proposals: 0,
        accepted_proposals: 0,
        total_value: 0
      };

      setClients([...clients, client]);
      setNewClient({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: ''
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create client:', error);
      toast.error('Failed to create client');
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      setClients(clients.filter(c => c.id !== clientId));
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast.error('Failed to delete client');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleClientSelect = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client);
      if (onClose) onClose();
    } else {
      setSelectedClient(client);
      setShowClientDetails(true);
    }
  };

  const exportClients = () => {
    const csvContent = [
      ['Name', 'Company', 'Email', 'Phone', 'Address', 'Status', 'Total Proposals', 'Accepted Proposals', 'Total Value'].join(','),
      ...filteredClients.map(client => [
        client.name,
        client.company,
        client.email,
        client.phone,
        client.address,
        client.status,
        client.total_proposals,
        client.accepted_proposals,
        `$${client.total_value.toLocaleString()}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white px-8 py-6 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Client Management</h1>
              <p className="text-gray-500 mt-1">Manage your client relationships and proposals</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#8C0000] text-white rounded-xl font-medium hover:bg-[#A00000] transition-colors shadow-lg shadow-[#8C0000]/20"
            >
              <Plus className="w-5 h-5" />
              Add New Client
            </button>
          </div>

          {/* Main Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-200/75 p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

              {/* Search */}
              <div className="relative flex-1 w-full md:max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#8C0000] transition-colors" />
                <input
                  type="text"
                  placeholder="Search clients by name, company, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8C0000]/10 focus:border-[#8C0000] transition-all outline-none text-sm placeholder:text-gray-400"
                />
              </div>

              {/* Actions Group */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 focus:border-[#8C0000] focus:ring-2 focus:ring-[#8C0000]/10 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <button
                  onClick={exportClients}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>

                <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

                <div className="flex bg-gray-100/50 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                    title="Table View"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client List Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8C0000]"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/75 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters to find what you are looking for.'
                  : 'Get started by adding your first client to the system.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8C0000] text-white rounded-xl font-medium hover:bg-[#A00000] transition-colors shadow-lg shadow-[#8C0000]/20"
              >
                <Plus className="w-5 h-5" />
                Add New Client
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client) => (
                  <motion.div
                    key={client.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white rounded-2xl border border-gray-200/75 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8C0000] to-[#500000] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-[#8C0000] transition-colors">
                            {client.name}
                          </h3>
                          {client.company && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3" />
                              {client.company}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === client.id ? null : client.id);
                          }}
                          className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === client.id && (
                          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-1.5 z-20 min-w-[160px] transform transition-all duration-200 ease-out animate-in slide-in-from-top-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientSelect(client);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setShowEditModal(true);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Client
                            </button>
                            <div className="h-px bg-gray-50 my-1.5" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">{client.email || 'No email'}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{client.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${client.status === 'active'
                        ? 'bg-[#8FBC8F]/20 text-[#2F4F4F] border-[#8FBC8F]/30'
                        : client.status === 'inactive'
                          ? 'bg-gray-50 text-gray-600 border-gray-200'
                          : 'bg-[#FFC917]/20 text-[#B8860B] border-[#FFC917]/30'
                        }`}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Lifetime Value</p>
                        <p className="font-semibold text-gray-900 text-sm">${client.total_value.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/75 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm group-hover:bg-[#8C0000] group-hover:text-white transition-colors">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            {client.company && <div className="text-xs text-gray-500">{client.company}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{client.email}</div>
                        {client.phone && <div className="text-xs text-gray-400">{client.phone}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${client.status === 'active'
                          ? 'bg-[#8FBC8F]/20 text-[#2F4F4F] border-[#8FBC8F]/30'
                          : client.status === 'inactive'
                            ? 'bg-gray-50 text-gray-600 border-gray-200'
                            : 'bg-[#FFC917]/20 text-[#B8860B] border-[#FFC917]/30'
                          }`}>
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-900">{client.accepted_proposals}</span>
                          <span className="text-xs">/ {client.total_proposals} won</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${client.total_value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === client.id ? null : client.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === client.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 z-50 text-left py-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientSelect(client);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setShowEditModal(true);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Client
                            </button>
                            <div className="h-px bg-gray-50 my-1.5" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Client Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <ClientDetailsForm
                  details={newClient}
                  onChange={(key, value) => setNewClient(prev => ({ ...prev, [key]: value }))}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateClient}
                    className="px-6 py-2 bg-[#8C0000] text-white rounded-lg hover:bg-[#A00000] transition-colors"
                  >
                    Create Client
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Client Details Modal */}
        <AnimatePresence>
          {showClientDetails && selectedClient && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowClientDetails(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-50 p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Client Details</h2>
                  <button
                    onClick={() => setShowClientDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedClient.name}</p>
                      </div>
                      {selectedClient.company && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Company</label>
                          <p className="text-gray-900">{selectedClient.company}</p>
                        </div>
                      )}
                      {selectedClient.email && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{selectedClient.email}</p>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <p className="text-gray-900">{selectedClient.phone}</p>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <p className="text-gray-900">{selectedClient.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Business Statistics</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${selectedClient.status === 'active' ? 'bg-[#8FBC8F]/20 text-[#2F4F4F]' :
                          selectedClient.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                            'bg-[#FFC917]/20 text-[#B8860B]'
                          }`}>
                          {selectedClient.status}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Proposals</label>
                        <p className="text-gray-900">{selectedClient.total_proposals}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Accepted Proposals</label>
                        <p className="text-gray-900">{selectedClient.accepted_proposals}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Value</label>
                        <p className="text-gray-900 font-semibold">${selectedClient.total_value.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Client Since</label>
                        <p className="text-gray-900">{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}