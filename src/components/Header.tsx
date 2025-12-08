import { User } from 'lucide-react';

interface HeaderProps {
    clientName: string;
    onClientNameChange: (name: string) => void;
}

export function Header({ clientName, onClientNameChange }: HeaderProps) {
    return (
        <div className="relative mb-8 overflow-hidden">
            {/* Gradient Background - Propodocs Maroon */}
            <div className="absolute inset-0 gradient-primary opacity-5"></div>

            <div className="relative text-center p-8">
                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-4xl font-light tracking-wide" style={{ color: '#3b82f6' }}>
                        VOGEL MARKETING GROUP
                    </h1>
                    <p className="text-sm text-gray-600 font-light tracking-wider mt-1">PRICING CALCULATOR</p>
                </div>
                {/* Client Name Input */}
                <div className="max-w-md mx-auto">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => onClientNameChange(e.target.value)}
                            placeholder="Client Name (Optional)"
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#3b82f6] focus:ring-4 focus:ring-red-100 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
