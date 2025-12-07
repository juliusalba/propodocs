import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, FileCheck, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password strength validation
    const passwordChecks = {
        length: password.length >= 8,
        match: password === confirmPassword && password.length > 0,
    };

    const isPasswordValid = passwordChecks.length && passwordChecks.match;

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        if (!isPasswordValid) {
            setError('Please ensure your password meets all requirements');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
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
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#8C0000] mb-4 shadow-lg shadow-[#8C0000]/20">
                        <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-[#050505] mb-2 tracking-tight">
                        Reset Password
                    </h1>
                    <p className="text-[#050505]/60 font-medium">
                        Enter your new password below
                    </p>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shadow-sm">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-green-900 mb-1">Password reset successful!</h3>
                                    <p className="text-sm text-green-800 font-medium leading-relaxed">
                                        Your password has been updated. Redirecting to login...
                                    </p>
                                </div>
                            </div>
                        </div>
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
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-bold text-[#050505] mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent outline-none transition-all font-medium text-[#050505]"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#050505] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-bold text-[#050505] mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent outline-none transition-all font-medium text-[#050505]"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#050505] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            {password && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-[#050505] uppercase tracking-wide opacity-70">Requirements:</p>
                                    <div className="space-y-2">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.length ? <Check size={14} className="stroke-[3]" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                                            <span>At least 8 characters</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${passwordChecks.match ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.match ? <Check size={14} className="stroke-[3]" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                                            <span>Passwords match</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !isPasswordValid || !token}
                                className="w-full py-4 bg-[#8C0000] text-white rounded-xl font-bold text-lg hover:bg-[#A00000] transition-all shadow-lg shadow-[#8C0000]/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>

                        {/* Back to Login */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-bold text-[#050505]/60 hover:text-[#8C0000] transition hover:underline"
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
