import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Users, ChevronDown, X, Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Client {
    id: number;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
}

interface ClientSelectorProps {
    selectedClientId?: number | null;
    clientName?: string;
    clientEmail?: string;
    clientCompany?: string;
    clientAddress?: string;
    onClientSelect: (client: Client | null) => void;
    onClientDataChange?: (data: { name: string; email: string; company: string; address: string }) => void;
}

export function ClientSelector({
    selectedClientId,
    clientName = '',
    onClientSelect,
    onClientDataChange,
}: ClientSelectorProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', company: '', address: '' });
    const [creating, setCreating] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedClient = clients.find(c => c.id === selectedClientId);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await api.getClients();
            setClients(data.clients || []);
        } catch (error) {
            console.error('Failed to load clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = (client: Client) => {
        onClientSelect(client);
        onClientDataChange?.({
            name: client.name,
            email: client.email || '',
            company: client.company || '',
            address: client.address || '',
        });
        setIsOpen(false);
        setSearch('');
    };

    const handleClearClient = () => {
        onClientSelect(null);
        onClientDataChange?.({ name: '', email: '', company: '', address: '' });
    };

    const handleCreateClient = async () => {
        if (!newClient.name.trim()) return;

        try {
            setCreating(true);
            const created = await api.createClient(newClient);
            setClients(prev => [created, ...prev]);
            handleSelectClient(created);
            setNewClient({ name: '', email: '', company: '', address: '' });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Failed to create client:', error);
        } finally {
            setCreating(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
                    } bg-white text-left`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {selectedClient ? (
                        <div className="min-w-0">
                            <span className="font-medium text-gray-900 truncate block">{selectedClient.name}</span>
                            {selectedClient.company && (
                                <span className="text-xs text-gray-500 truncate block">{selectedClient.company}</span>
                            )}
                        </div>
                    ) : clientName ? (
                        <span className="text-gray-700">{clientName}</span>
                    ) : (
                        <span className="text-gray-400">Select or add client...</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {(selectedClient || clientName) && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearClient();
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
                    >
                        {/* Search */}
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Client List */}
                        <div className="max-h-48 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-400">Loading...</div>
                            ) : filteredClients.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    {search ? 'No clients found' : 'No clients yet'}
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => handleSelectClient(client)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left ${selectedClientId === client.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8C0000] to-[#500000] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-gray-900 truncate">{client.name}</div>
                                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                {client.company && (
                                                    <>
                                                        <Building2 className="w-3 h-3" />
                                                        {client.company}
                                                    </>
                                                )}
                                                {client.email && !client.company && client.email}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Create New Client */}
                        <div className="border-t border-gray-100">
                            {showCreateForm ? (
                                <div className="p-3 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Client name *"
                                        value={newClient.name}
                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Company"
                                        value={newClient.company}
                                        onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateForm(false)}
                                            className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCreateClient}
                                            disabled={!newClient.name.trim() || creating}
                                            className="flex-1 px-3 py-2 text-sm bg-[#8C0000] text-white rounded-lg hover:bg-[#A00000] disabled:opacity-50"
                                        >
                                            {creating ? 'Creating...' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#8C0000] hover:bg-[#8C0000]/5 transition-colors font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add New Client
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
