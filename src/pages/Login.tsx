import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FileCheck, ArrowRight } from 'lucide-react';

export function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = window.location; // Use window.location as fallback for URLSearchParams

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('expired')) {
            setError('Session expired. Please sign in again.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register({ email, password, name, company });
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
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
                    <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#8C0000] mb-4 shadow-lg shadow-[#8C0000]/20">
                            <FileCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-[#050505] mb-2 tracking-tight">
                            Propodocs
                        </h1>
                    </Link>
                    <p className="text-[#050505]/60 font-medium">
                        {isLogin ? 'Sign in to your account' : 'Start your 14-day free trial'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-[#8C0000] text-sm font-medium flex items-center justify-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-[#050505] mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent hover:border-gray-300 outline-none transition-all font-medium text-[#050505]"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#050505] mb-1.5">
                                    Company (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent hover:border-gray-300 outline-none transition-all font-medium text-[#050505]"
                                    placeholder="Acme Inc."
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-[#050505] mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent hover:border-gray-300 outline-none transition-all font-medium text-[#050505]"
                            placeholder="you@company.com"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-bold text-[#050505]">
                                Password
                            </label>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8C0000] focus:border-transparent hover:border-gray-300 outline-none transition-all font-medium text-[#050505]"
                            placeholder="••••••••"
                        />
                        {isLogin && (
                            <div className="flex justify-end mt-2">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-semibold text-[#8C0000] hover:text-[#A00000] outline-none focus:underline"
                                    tabIndex={0}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#8C0000] text-white rounded-xl font-bold text-lg hover:bg-[#A00000] active:scale-95 transition-all shadow-lg shadow-[#8C0000]/20 hover:shadow-[#8C0000]/30 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300"></span>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:4001/api'}/auth/google`}
                        className="w-full py-3 bg-white border border-gray-300 rounded-xl font-bold text-[#050505] hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </a>
                </form>

                {/* Toggle Login/Register */}
                <div className="mt-8 text-center">
                    <p className="text-[#050505]/60 text-sm font-medium">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[#8C0000] font-bold hover:underline"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
