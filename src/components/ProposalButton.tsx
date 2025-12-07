import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { TemplateSelector } from './TemplateSelector';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientDetails } from '../types';

interface ProposalButtonProps {
    clientName: string;
    clientDetails?: ClientDetails;
    calculatorType: 'vmg' | 'marine' | 'marketing' | 'custom';
    calculatorData: any;
    totals: any;
    onValidate?: () => boolean;
}

export function ProposalButton({
    clientName,
    clientDetails,
    calculatorType,
    calculatorData,
    totals,
    onValidate,
}: ProposalButtonProps) {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [searchParams] = useSearchParams();
    const proposalId = searchParams.get('id');

    const handleCreateProposal = async (template: any | null, useAI: boolean) => {
        if (onValidate && !onValidate()) {
            return;
        }

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            let content: any = [
                {
                    type: 'paragraph',
                    content: 'Start writing your proposal here...'
                }
            ];

            // If using AI, generate content first
            if (useAI) {
                try {
                    const aiResult = await api.generateProposal({
                        clientName,
                        calculatorType,
                        calculatorData: { ...calculatorData, totals },
                    });
                    content = aiResult.content;
                } catch (error) {
                    console.error('AI generation failed, using default content:', error);
                }
            } else if (template) {
                // Use template content
                content = template.content;
            }

            // Proposal Data
            const date = new Date().toLocaleDateString();
            const proposalData = {
                title: `${clientName} Proposal - ${date}`,
                clientName,
                clientCompany: clientDetails?.company,
                clientEmail: clientDetails?.email,
                clientPhone: clientDetails?.phone,
                clientAddress: clientDetails?.address,
                calculatorType,
                calculatorData: { ...calculatorData, totals },
                content: (useAI || template) ? content : undefined,
                template_id: template?.id,
            };

            if (proposalId) {
                // Update Existing
                await api.updateProposal(Number(proposalId), {
                    title: proposalData.title,
                    calculator_data: proposalData.calculatorData,
                    ...(useAI ? { content } : {})
                });
                navigate(`/proposals/${proposalId}/edit`);
            } else {
                // Create New
                const response = await api.createProposal(proposalData);
                navigate(`/proposals/${response.proposal.id}/edit`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create proposal');
        } finally {
            setLoading(false);
            setShowTemplateModal(false);
        }
    };

    return (
        <>
            <div className="space-y-2">
                <div className="space-y-3">
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                    >
                        <FileText className="w-5 h-5" />
                        {proposalId ? 'Update Proposal' : 'Generate Proposal'}
                    </button>

                    {proposalId && (
                        <button
                            onClick={() => navigate(`/proposals/${proposalId}/edit`)}
                            className="w-full bg-white border-2 border-[#3b82f6] text-[#3b82f6] font-bold py-3 px-6 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Back to Editor
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showTemplateModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTemplateModal(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <TemplateSelector
                                onSelect={handleCreateProposal}
                                onCancel={() => setShowTemplateModal(false)}
                                loading={loading}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
