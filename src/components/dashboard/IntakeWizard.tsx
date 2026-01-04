import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MessageSquare,
    FileText,
    ArrowRight,
    Sparkles,
    Calculator,
    ChevronLeft,
    CheckCircle,
    Building2,
    User,
    Globe
} from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Toast';

interface IntakeWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'mode' | 'transcript' | 'analysis' | 'details' | 'pricing';

export function IntakeWizard({ isOpen, onClose }: IntakeWizardProps) {
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState<Step>('mode');
    const [transcript, setTranscript] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        clientName: '',
        clientCompany: '',
        clientIndustry: '',
        website: '',
        email: '',
        goals: [] as string[],
        summary: '',
        suggestedServices: [] as string[]
    });

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        if (!transcript.trim()) {
            toast.error("Please enter a transcript or notes");
            return;
        }

        setIsAnalyzing(true);
        setStep('analysis');

        try {
            const result = await api.analyzeTranscript(transcript);
            const analysis = result.analysis;

            setFormData(prev => ({
                ...prev,
                clientName: analysis.clientName || '',
                clientCompany: analysis.clientCompany || '',
                clientIndustry: analysis.clientIndustry || '',
                summary: analysis.summary || '',
                goals: analysis.projectGoals || [],
                suggestedServices: analysis.suggestedServices || []
            }));

            setStep('details');
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze transcript");
            setStep('transcript');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreateProposal = (calculatorType: 'manual' | 'marketing' | 'custom') => {
        // In a real implementation, we might navigate to a specific calculator 
        // with pre-filled state, or create the proposal directly.
        // For now, let's route to the new proposal page with params

        const params = new URLSearchParams({
            mode: 'ai_setup',
            client: formData.clientName,
            company: formData.clientCompany,
            industry: formData.clientIndustry,
            calcType: calculatorType
        });

        // Store temp data in session/local storage or state management if needed
        // For simple passing, we can use state or specialized route
        // We'll use the existing /proposals/new route but enhanced

        // Simulating creation by navigating to blank for now, but in reality 
        // this would trigger the AI generation endpoint or pre-fill the editor
        navigate(`/proposals/new?${params.toString()}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                        {step !== 'mode' && step !== 'analysis' && (
                            <button
                                onClick={() => {
                                    if (step === 'details') setStep('transcript');
                                    else if (step === 'pricing') setStep('details');
                                    else if (step === 'transcript') setStep('mode');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">AI Proposal Assistant</h2>
                            <p className="text-sm text-gray-500">
                                {step === 'mode' && "How would you like to start?"}
                                {step === 'transcript' && "Tell us about the project"}
                                {step === 'analysis' && "Analyzing your inputs..."}
                                {step === 'details' && "Confirm Client Details"}
                                {step === 'pricing' && "Select Pricing Strategy"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                    <AnimatePresence mode="wait">
                        {step === 'mode' && (
                            <motion.div
                                key="mode"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid gap-4"
                            >
                                <button
                                    onClick={() => setStep('transcript')}
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-transparent hover:border-[#8C0000] shadow-sm hover:shadow-md transition-all text-left group"
                                >
                                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-6 h-6 text-[#8C0000]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Analyze Conversation</h3>
                                        <p className="text-gray-500 text-sm mb-3">Paste a transcript, meeting notes, or project brief. AI will extract details and suggest a structure.</p>
                                        <span className="text-[#8C0000] text-sm font-medium flex items-center">
                                            Start with AI <ArrowRight className="w-4 h-4 ml-1" />
                                        </span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStep('details')}
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-transparent hover:border-gray-300 shadow-sm hover:shadow-md transition-all text-left group"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Manual Entry</h3>
                                        <p className="text-gray-500 text-sm mb-3">Manually enter client details and select a template. Good for simple proposals.</p>
                                        <span className="text-gray-600 text-sm font-medium flex items-center">
                                            Enter Manually <ArrowRight className="w-4 h-4 ml-1" />
                                        </span>
                                    </div>
                                </button>
                            </motion.div>
                        )}

                        {step === 'transcript' && (
                            <motion.div
                                key="transcript"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Paste meeting notes, email chain, or transcript
                                    </label>
                                    <textarea
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        placeholder="E.g. 'Met with John from Acme Corp. They need a new website and ongoing SEO. Budget is around $5k/mo...'"
                                        className="w-full h-64 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8C0000] focus:border-transparent resize-none text-base"
                                    />
                                    <div className="mt-4 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">AI will extract client info and requirements.</p>
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={!transcript.trim()}
                                            className="bg-[#8C0000] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#A00000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Analyze & Continue
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'analysis' && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                <div className="relative w-24 h-24 mb-8">
                                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-[#8C0000] rounded-full border-t-transparent animate-spin"></div>
                                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-[#8C0000] animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{isAnalyzing ? 'Analyzing Context' : 'Processing...'}</h3>
                                <p className="text-gray-500 text-center max-w-sm">
                                    Extracting client details, identifying pain points, and formulating strategy...
                                </p>
                            </motion.div>
                        )}

                        {step === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Client Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={formData.clientName}
                                                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8C0000] focus:border-transparent"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company Name</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={formData.clientCompany}
                                                    onChange={e => setFormData({ ...formData, clientCompany: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8C0000] focus:border-transparent"
                                                    placeholder="Acme Inc."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Industry</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.clientIndustry}
                                                onChange={e => setFormData({ ...formData, clientIndustry: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8C0000] focus:border-transparent"
                                                placeholder="Technology, Healthcare, etc."
                                            />
                                        </div>
                                    </div>

                                    {formData.summary && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" /> AI Summary
                                            </h4>
                                            <p className="text-sm text-blue-800 leading-relaxed">{formData.summary}</p>
                                        </div>
                                    )}

                                    {formData.suggestedServices.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Suggested Services to Include</label>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.suggestedServices.map((service, i) => (
                                                    <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium border border-emerald-100 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setStep('pricing')}
                                    className="w-full bg-[#8C0000] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A00000] transition-colors shadow-lg shadow-red-900/20"
                                >
                                    Confirm & Continue
                                </button>
                            </motion.div>
                        )}

                        {step === 'pricing' && (
                            <motion.div
                                key="pricing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid gap-4"
                            >
                                <button
                                    onClick={() => handleCreateProposal('marketing')}
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-transparent hover:border-[#8C0000] shadow-sm hover:shadow-md transition-all text-left group"
                                >
                                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Calculator className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Performance Marketing Calculator</h3>
                                        <p className="text-gray-500 text-sm mb-3">Calculate ROI, ad spend, and management fees. Best for PPC/Social agencies.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleCreateProposal('manual')}
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-transparent hover:border-[#8C0000] shadow-sm hover:shadow-md transition-all text-left group"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Manual Pricing</h3>
                                        <p className="text-gray-500 text-sm mb-3">Define your own line items and costs from scratch.</p>
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
