import { useState, useEffect, useRef } from 'react';
import { Search, Building2, Mail, MapPin } from 'lucide-react';
import { api } from '../lib/api';

interface Client {
    id: number;
    name: string;
    company?: string;
    email?: string;
    address?: string;
    phone?: string;
}

interface ClientAutocompleteProps {
    onSelect: (client: Partial<Client>) => void;
    placeholder?: string;
    className?: string;
}

export function ClientAutocomplete({ onSelect, placeholder = 'Search clients...', className = '' }: ClientAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [recentClients, setRecentClients] = useState<Client[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Load recent clients from localStorage
    useEffect(() => {
        try {
            const recent = localStorage.getItem('recent_clients');
            if (recent) {
                setRecentClients(JSON.parse(recent));
            }
        } catch (error) {
            console.error('Failed to load recent clients:', error);
        }
    }, []);

    // Fetch clients when query changes
    useEffect(() => {
        if (query.length < 2) {
            setClients([]);
            return;
        }

        const fetchClients = async () => {
            setLoading(true);
            try {
                // Extract unique clients from proposals since there's no dedicated clients endpoint
                const response = await api.getProposals();
                const proposals = response.proposals || [];

                // Build unique clients from proposals
                const clientMap = new Map<string, Client>();
                proposals.forEach((proposal: any, index: number) => {
                    if (proposal.client_name) {
                        const key = proposal.client_name.toLowerCase();
                        if (!clientMap.has(key)) {
                            clientMap.set(key, {
                                id: index + 1,
                                name: proposal.client_name,
                                company: proposal.client_company,
                                email: proposal.client_email,
                                address: proposal.client_address,
                                phone: proposal.client_phone,
                            });
                        }
                    }
                });

                const allClients = Array.from(clientMap.values());
                const filtered = allClients.filter((client: Client) =>
                    client.name.toLowerCase().includes(query.toLowerCase()) ||
                    client.company?.toLowerCase().includes(query.toLowerCase()) ||
                    client.email?.toLowerCase().includes(query.toLowerCase())
                );
                setClients(filtered.slice(0, 5)); // Limit to 5 results
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchClients, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (client: Client) => {
        // Save to recent clients
        const updated = [client, ...recentClients.filter(c => c.id !== client.id)].slice(0, 10);
        setRecentClients(updated);
        localStorage.setItem('recent_clients', JSON.stringify(updated));

        // Notify parent
        onSelect({
            name: client.name,
            company: client.company,
            email: client.email,
            address: client.address,
            phone: client.phone,
        });

        setQuery(client.name);
        setIsOpen(false);
    };

    const displayClients = query.length >= 2 ? clients : recentClients;

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C0000] focus:border-transparent outline-none transition-all"
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin w-5 h-5 border-2 border-[#8C0000] border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : displayClients.length > 0 ? (
                        <>
                            {query.length < 2 && (
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                                    Recent Clients
                                </div>
                            )}
                            {displayClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => handleSelect(client)}
                                    className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#8C0000]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Building2 className="w-4 h-4 text-[#8C0000]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900">{client.name}</p>
                                            {client.company && (
                                                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                                    <Building2 className="w-3 h-3" />
                                                    {client.company}
                                                </p>
                                            )}
                                            {client.email && (
                                                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="w-3 h-3" />
                                                    {client.email}
                                                </p>
                                            )}
                                            {client.address && (
                                                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    {client.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No clients found</p>
                            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No recent clients</p>
                            <p className="text-xs text-gray-400 mt-1">Start typing to search</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
