import { useState } from 'react';
import {
    Mail,
    User,
    Building,
    ArrowRight,
    Loader2,
    Shield,
    Eye
} from 'lucide-react';

interface EmailGateProps {
    proposalTitle: string;
    clientName?: string;
    onVerified: (viewerData: { email: string; name: string; company?: string }) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function EmailGate({ proposalTitle, clientName, onVerified }: EmailGateProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [step, setStep] = useState<'email' | 'name'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Check if viewer exists
            const response = await fetch(`${API_BASE_URL}/proposals/check-viewer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.exists && data.viewer) {
                // Viewer already exists, proceed directly
                onVerified({
                    email,
                    name: data.viewer.name || email.split('@')[0],
                    company: data.viewer.company,
                });
            } else {
                // New viewer, need to collect name
                setStep('name');
            }
        } catch (err) {
            // If check fails, still allow to proceed by collecting name
            setStep('name');
        } finally {
            setLoading(false);
        }
    };

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onVerified({ email, name, company: company || undefined });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] p-6 text-center">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Eye className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-1">View Proposal</h1>
                        <p className="text-white/70 text-sm">{proposalTitle}</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {step === 'email' ? (
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Enter your email to view this proposal
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            required
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-red-500 text-sm mt-2">{error}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleNameSubmit} className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Welcome! Please tell us your name so we can personalize your experience.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Your full name *"
                                                required
                                                autoFocus
                                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                placeholder="Company (optional)"
                                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!name.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        View Proposal
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <Shield className="w-3.5 h-3.5" />
                                Your information is secure and will only be used to personalize your experience
                            </div>
                        </div>
                    </div>
                </div>

                {clientName && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Prepared for <span className="font-medium text-gray-700">{clientName}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
