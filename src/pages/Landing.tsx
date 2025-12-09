import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    LogIn,
    Shield,
    Zap,
    Briefcase,
    FileCheck,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
    };

    return (
        // Vogel Palette: Background Cream (#FAF3CD), Text Black (#050505)
        <div className="min-h-screen bg-[#FAF3CD] text-[#050505] selection:bg-[#8C0000] selection:text-white overflow-hidden font-sans">

            {/* Grain Texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Navigation */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-6"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-md border border-[#CD8417]/20 shadow-sm rounded-2xl px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#8C0000] flex items-center justify-center shadow-lg shadow-[#8C0000]/20">
                                <FileCheck className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-[#050505] tracking-tight">Propodocs</span>
                        </div>

                        {/* Navigation Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-semibold text-[#050505]/70 hover:text-[#8C0000] transition-colors">Features</a>
                            <a href="#process" className="text-sm font-semibold text-[#050505]/70 hover:text-[#8C0000] transition-colors">Process</a>
                            <a href="#for-who" className="text-sm font-semibold text-[#050505]/70 hover:text-[#8C0000] transition-colors">For Agencies</a>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#050505] text-white rounded-xl font-medium hover:bg-[#8C0000] transition-all shadow-lg shadow-gray-900/20 text-sm"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex items-center gap-2 px-5 py-2 bg-transparent text-[#050505] border-2 border-[#050505] rounded-xl font-bold hover:bg-[#050505] hover:text-white transition-all text-sm"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFC917] border border-[#CD8417] shadow-sm mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-[#8C0000] animate-pulse"></span>
                            <span className="text-xs font-bold text-[#050505] uppercase tracking-wide">The New Standard in Proposals</span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-6xl lg:text-8xl font-black text-[#050505] mb-8 tracking-tight leading-[0.95]"
                        >
                            Professional Proposals <br />
                            <span className="text-[#8C0000]">
                                in Minutes, Not Hours.
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-xl text-[#050505]/80 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
                        >
                            Stop wrestling with formatting. Document your value and close deals faster with our intelligent proposal management platform built for modern agencies.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                        >
                            <button
                                onClick={() => navigate(user ? '/dashboard' : '/login')}
                                className="px-8 py-4 bg-[#8C0000] text-white rounded-xl font-bold text-lg hover:bg-[#A00000] hover:-translate-y-1 transition-all shadow-xl shadow-[#8C0000]/20 flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                                Start Creating for Free
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button className="px-8 py-4 bg-white text-[#050505] border-2 border-[#050505] rounded-xl font-bold text-lg hover:bg-gray-50 transition-all w-full sm:w-auto">
                                View Sample Proposal
                            </button>
                        </motion.div>

                        {/* Social Proof / Stats */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-[#CD8417]/30 py-8"
                        >
                            <div>
                                <div className="text-3xl font-black text-[#8C0000]">60s</div>
                                <div className="text-sm font-semibold text-[#050505]/70">Average Creation Time</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-[#8C0000]">20%</div>
                                <div className="text-sm font-semibold text-[#050505]/70">Higher Acceptance Rate</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-[#8C0000]">10h+</div>
                                <div className="text-sm font-semibold text-[#050505]/70">Saved Per Week</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-[#8C0000]">100%</div>
                                <div className="text-sm font-semibold text-[#050505]/70">Brand Consistency</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Why Use This Tool */}
            <section id="features" className="py-24 bg-white px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-[#050505] mb-4">Why Propodocs?</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Eliminate the friction between your pitch and the signed contract.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Speed & Efficiency",
                                description: "Generate comprehensive proposals in under a minute using our intelligent templates and calculators."
                            },
                            {
                                icon: Shield,
                                title: "Rock-Solid Accuracy",
                                description: "Eliminate pricing errors. Our integrated calculators ensure every quote is profitable and accurate."
                            },
                            {
                                icon: Briefcase,
                                title: "Professional Polish",
                                description: "Make a stunning first impression with consistently branded, beautifully formatted documents."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-[#FAF3CD] border border-[#CD8417]/20 hover:border-[#8C0000]/30 transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 rounded-2xl bg-[#FFC917] flex items-center justify-center mb-6 border-2 border-[#050505]">
                                    <feature.icon className="w-7 h-7 text-[#050505]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#050505] mb-3">{feature.title}</h3>
                                <p className="text-[#050505]/80 leading-relaxed font-medium">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="process" className="py-24 bg-[#050505] text-[#FAF3CD] px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-[#FAF3CD] mb-4">How It Works</h2>
                        <p className="text-xl text-[#FAF3CD]/70 max-w-2xl mx-auto">From scope to signature in four simple steps.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-[#CD8417]/30 -z-0" />

                        {[
                            { title: "Select Scope", desc: "Choose services and deliverables from your library." },
                            { title: "Customize Pricing", desc: "Adjust rates, margins, and add-ons instantly." },
                            { title: "Review & Send", desc: "Preview the generated PDF and send via secure link." },
                            { title: "Get Signed", desc: "Client reviews and signs digitally. Done." }
                        ].map((step, i) => (
                            <div key={i} className="relative z-10 text-center">
                                <div className="w-24 h-24 mx-auto rounded-full bg-[#050505] border-4 border-[#8C0000] flex items-center justify-center mb-6">
                                    <span className="text-3xl font-black text-white">{i + 1}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-[#FAF3CD]/60 text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Who is this for */}
            <section id="for-who" className="py-24 bg-[#FFC917] px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2">
                        <h2 className="text-5xl font-black text-[#050505] mb-6 leading-tight">Built for those who value their time.</h2>
                        <div className="space-y-6">
                            {[
                                "Digital Marketing Agencies",
                                "Creative Freelancers",
                                "Business Consultants",
                                "Software Development Shops"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#050505] flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-[#FFC917]" />
                                    </div>
                                    <span className="text-2xl font-bold text-[#050505]">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <div className="bg-[#050505] p-8 rounded-3xl text-[#FAF3CD] shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-[#8C0000]"></div>
                                <div>
                                    <div className="font-bold text-lg">Alex V.</div>
                                    <div className="text-[#FAF3CD]/60 text-sm">Agency Founder</div>
                                </div>
                            </div>
                            <p className="text-xl font-medium leading-relaxed italic">
                                "Propodocs changed everything for us. We used to spend hours on proposals every Friday. Now it takes 15 minutes, and our close rate has never been higher."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl font-black text-[#050505] mb-8">Ready to win more business?</h2>
                    <p className="text-2xl text-gray-600 mb-12">Join hundreds of agencies streamlining their sales process today.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-10 py-5 bg-[#8C0000] text-white rounded-2xl font-black text-xl hover:bg-[#A00000] hover:scale-105 transition-all shadow-xl shadow-[#8C0000]/30"
                    >
                        Get Started for Free
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-[#050505] text-[#FAF3CD]/40 text-center border-t border-[#CD8417]/20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-6 h-6 text-[#8C0000]" />
                        <span className="text-lg font-bold text-white">Propodocs</span>
                    </div>
                    <div className="text-sm">
                        &copy; 2025 Propodocs. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
} 
