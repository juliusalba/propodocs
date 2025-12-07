import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export function AcceptanceSuccess() {
    const { token } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Get proposal data from location state or fetch it
    useEffect(() => {
        const loadProposal = async () => {
            try {
                if (location.state?.proposal) {
                    setProposal(location.state.proposal);
                } else if (token) {
                    const response = await api.getProposalByToken(token);
                    setProposal(response.proposal);
                }
            } catch (error) {
                console.error('Failed to load proposal:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProposal();
    }, [token, location.state]);

    const handleDownloadPDF = () => {
        if (token) {
            window.open(`/api/proposals/${token}/pdf`, '_blank');
        }
    };

    const handleReturnToProposal = () => {
        if (token) {
            navigate(`/view/${token}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-12 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                    >
                        <CheckCircle className="w-14 h-14 text-green-600" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-3">
                        Proposal Accepted!
                    </h1>
                    <p className="text-green-100 text-lg">
                        Thank you for your decision. We're excited to work with you!
                    </p>
                </div>

                {/* Proposal Details */}
                <div className="p-8 space-y-6">
                    {proposal && (
                        <>
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                    Proposal Details
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Client:</span>
                                        <span className="font-semibold text-gray-900">{proposal.client_name}</span>
                                    </div>
                                    {proposal.client_company && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Company:</span>
                                            <span className="font-semibold text-gray-900">{proposal.client_company}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Proposal:</span>
                                        <span className="font-semibold text-gray-900">{proposal.title || 'Untitled'}</span>
                                    </div>
                                    {proposal.calculator_data?.totals?.monthlyTotal && (
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                            <span className="text-gray-600">Monthly Investment:</span>
                                            <span className="font-bold text-green-600 text-lg">
                                                ${proposal.calculator_data.totals.monthlyTotal.toLocaleString()}/mo
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Accepted On:</span>
                                        <span className="font-semibold text-gray-900">
                                            {new Date().toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Signature Display */}
                            {proposal.client_signature_url && (
                                <div className="bg-blue-50 rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Your Signature</h3>
                                    <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
                                        <img
                                            src={proposal.client_signature_url}
                                            alt="Client Signature"
                                            className="h-20 object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Next Steps */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            What's Next?
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>You'll receive a confirmation email shortly with all the details</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Our team will reach out within 1-2 business days to schedule a kickoff call</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Download a copy of the proposal for your records using the button below</span>
                            </li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
                        >
                            <Download className="w-5 h-5" />
                            Download PDF Copy
                        </button>
                        <button
                            onClick={handleReturnToProposal}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Return to Proposal
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
