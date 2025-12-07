import { User, Building, Mail, Phone, MapPin } from 'lucide-react';

export interface ClientDetails {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
}

interface ClientDetailsFormProps {
    details: ClientDetails;
    onChange: (key: keyof ClientDetails, value: string) => void;
    existingClients?: ClientDetails[];
}

export function ClientDetailsForm({ details, onChange, existingClients = [] }: ClientDetailsFormProps) {
    const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = existingClients.find(c => c.name === e.target.value);
        if (selected) {
            onChange('name', selected.name);
            onChange('company', selected.company || '');
            onChange('email', selected.email || '');
            onChange('phone', selected.phone || '');
            onChange('address', selected.address || '');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Details
                </h2>
                {existingClients.length > 0 && (
                    <select
                        onChange={handleSelectClient}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#3b82f6]"
                        defaultValue=""
                    >
                        <option value="" disabled>Select existing client...</option>
                        {existingClients.map((client, i) => (
                            <option key={`${client.name}-${i}`} value={client.name}>
                                {client.name} {client.company ? `(${client.company})` : ''}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={details.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Acme Inc."
                            value={details.company}
                            onChange={(e) => onChange('company', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            placeholder="john@example.com"
                            value={details.email}
                            onChange={(e) => onChange('email', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={details.phone}
                            onChange={(e) => onChange('phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="123 Business Rd, City, State"
                            value={details.address}
                            onChange={(e) => onChange('address', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}