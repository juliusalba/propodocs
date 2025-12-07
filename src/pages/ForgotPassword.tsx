import { useState } from 'react';
import { ArrowLeft, FileCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF3CD] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Grain Texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Simple Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#8C0000]" />
            <div className="absolute bottom-0 left-0 w-full h-2 bg-[#050505]" />

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-[#CD8417]/10 p-10 border border-[#CD8417]/20 relative z-10">
                {/* Back to Login */}
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 text-sm text-[#050505]/60 hover:text-[#8C0000] font-bold transition mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#8C0000] mb-4 shadow-lg shadow-[#8C0000]/20">
                        <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-[#050505] mb-2 tracking-tight">
                        Forgot Password?
                    </h1>
                    <p className="text-[#050505]/60 font-medium leading-relaxed">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shadow-sm">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-green-900 mb-1">Check your email</h3>
                                    <p className="text-sm text-green-800 font-medium leading-relaxed">
                                        If an account exists with this email, we've sent you a password reset link. Please check your inbox.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-[#050505]/60 text-center font-medium">
                            Didn't receive an email? Check your spam folder or try again.
                        </p>
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setEmail('');
                            }}
                            className="w-full py-3 text-sm text-[#050505]/60 hover:text-[#8C0000] font-bold transition hover:bg-gray-50 rounded-xl"
                        >
                            Try another email
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-[#8C0000] text-sm font-medium flex items-center justify-center text-center">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-[#050505] mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent outline-none transition-all font-medium text-[#050505]"
                                    placeholder="you@company.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#8C0000] text-white rounded-xl font-bold text-lg hover:bg-[#A00000] transition-all shadow-lg shadow-[#8C0000]/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
