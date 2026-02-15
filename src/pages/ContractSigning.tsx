import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    FileSignature,
    CheckCircle,
    AlertCircle,
    Loader2,
    User,
    Mail,
    Shield,
    Clock
} from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

interface ContractData {
    id: number;
    title: string;
    content: string;
    client_name: string;
    client_company?: string;
    deliverables?: Array<{
        name: string;
        description?: string;
        price?: number;
        priceType?: string;
    }>;
    total_value?: number;
    contract_term?: string;
    status: string;
    client_signed_at?: string;
    expires_at?: string;
}

export function ContractSigning() {
    const { token } = useParams<{ token: string }>();

    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<ContractData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Signing form
    const [signerName, setSignerName] = useState('');
    const [signerEmail, setSignerEmail] = useState('');
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [signing, setSigning] = useState(false);
    const [signed, setSigned] = useState(false);

    useEffect(() => {
        if (token) loadContract();
    }, [token]);

    const loadContract = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/contracts/view/${token}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to load contract');
            }
            const data = await response.json();
            setContract(data);
            setSignerName(data.client_name || '');
            if (data.client_signed_at) {
                setSigned(true);
            }
        } catch (err: any) {
            setError(err.message || 'Contract not found');
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        if (!signatureData || !signerName) {
            return;
        }

        setSigning(true);
        try {
            const response = await fetch(`${API_BASE_URL}/contracts/sign/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signer_name: signerName,
                    signer_email: signerEmail,
                    signature_data: signatureData,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to sign');
            }

            setSigned(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSigning(false);
        }
    };

    // Render markdown-ish content
    const renderContent = (content: string) => {
        return content
            .split('\n')
            .map((line, i) => {
                if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
                }
                if (line.startsWith('---')) {
                    return <hr key={i} className="my-6 border-gray-200" />;
                }
                if (line.trim() === '') {
                    return <br key={i} />;
                }
                // Bold text
                const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
            });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Contract</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (signed) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Contract Signed!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you, {signerName}. Your signature has been recorded and the contract owner will be notified.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 text-left text-sm">
                        <p className="text-gray-500 mb-1">Signed at:</p>
                        <p className="font-medium">{new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!contract) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-xl flex items-center justify-center">
                            <FileSignature className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">{contract.title}</h1>
                            <p className="text-sm text-gray-500">Contract for {contract.client_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Shield className="w-4 h-4" />
                        Secure e-Signature
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contract Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                <h2 className="font-semibold text-gray-900">{contract.title}</h2>
                                {contract.contract_term && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Contract Term: {contract.contract_term}
                                    </p>
                                )}
                            </div>
                            <div className="p-6 prose prose-sm max-w-none">
                                {renderContent(contract.content)}
                            </div>
                        </div>
                    </div>

                    {/* Signing Panel */}
                    <div className="space-y-6">
                        {/* Contract Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Contract Summary</h3>
                            <div className="space-y-3 text-sm">
                                {contract.total_value && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Value</span>
                                        <span className="font-semibold text-gray-900">
                                            ${contract.total_value.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {contract.contract_term && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Term</span>
                                        <span className="font-medium">{contract.contract_term}</span>
                                    </div>
                                )}
                                {contract.expires_at && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Expires</span>
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <Clock className="w-3 h-3" />
                                            {new Date(contract.expires_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deliverables */}
                        {contract.deliverables && contract.deliverables.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Included Services</h3>
                                <ul className="space-y-2">
                                    {contract.deliverables.map((d, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{d.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Signing Form */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileSignature className="w-4 h-4" />
                                Sign Contract
                            </h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Your Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={signerName}
                                            onChange={(e) => setSignerName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Your Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={signerEmail}
                                            onChange={(e) => setSignerEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-2">Your Signature *</label>
                                <SignaturePad
                                    onSignature={(data) => setSignatureData(data)}
                                    width={300}
                                    height={150}
                                />
                            </div>

                            <button
                                onClick={handleSign}
                                disabled={!signatureData || !signerName || signing}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {signing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <FileSignature className="w-5 h-5" />
                                        Sign Contract
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center mt-4">
                                By signing, you agree to the terms and conditions outlined in this contract.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 mt-12">
                <div className="max-w-4xl mx-auto px-6 py-4 text-center text-sm text-gray-400">
                    Secured by Propodocs • E-Signature Platform
                </div>
            </footer>
        </div>
    );
}
