import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    Download,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Send,
    PenTool,
    X,
    Eraser,
    Reply
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api } from '../lib/api';
import { PricingSummary } from '../components/PricingSummary';
import { EmailGate } from '../components/EmailGate';
import { DeliverablesSection } from '../components/DeliverablesSection';
import { ScopeSection } from '../components/ScopeSection';
import type { Proposal } from '../types';

interface Comment {
    id: number;
    proposal_id: number;
    author_name: string;
    content: string;
    highlighted_text?: string;
    created_at: string;
    is_resolved?: boolean;
    parent_comment_id?: number;
    replies?: Comment[];
}

export function ProposalView() {
    const { token } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [viewId, setViewId] = useState<number | null>(null);
    const [password, setPassword] = useState('');
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [highlightedText, setHighlightedText] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commenterName, setCommenterName] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [clientSignatureUrl, setClientSignatureUrl] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);

    // Viewer tracking state
    const [requiresEmailGate, setRequiresEmailGate] = useState(false);
    const [viewerSessionId, setViewerSessionId] = useState<number | null>(null);
    const [viewerData, setViewerData] = useState<{ email: string; name: string; company?: string } | null>(null);
    const [proposalMeta, setProposalMeta] = useState<{ title: string; clientName: string } | null>(null);

    const editor = useCreateBlockNote();
    const startTime = useRef(Date.now());
    const commentSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) {
                const text = selection.toString().trim();
                if (text.length > 0) {
                    setHighlightedText(text);
                    setShowCommentForm(true);
                    return;
                }
            }
        };

        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, []);

    useEffect(() => {
        if (token) {
            loadProposal();
        }
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (viewId) {
                const duration = Math.floor((Date.now() - startTime.current) / 1000);
                api.updateViewDuration(viewId, duration).catch(console.error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [viewId]);

    // Viewer session heartbeat for tracking duration
    useEffect(() => {
        if (!viewerSessionId) return;

        const interval = setInterval(() => {
            const duration = Math.floor((Date.now() - startTime.current) / 1000);
            api.updateViewSession(viewerSessionId, { duration_seconds: duration }).catch(console.error);
        }, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [viewerSessionId]);

    const loadProposal = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getProposalByToken(token!, password);

            if (data.error) {
                if (data.requiresPassword) {
                    setRequiresPassword(true);
                    setLoading(false);
                    return;
                }
                throw new Error(data.error);
            }

            // Store proposal metadata for email gate
            setProposalMeta({
                title: data.proposal.title,
                clientName: data.proposal.client_name,
            });

            // Check if email gate is enabled (via theme settings or default behavior)
            const emailGateEnabled = data.proposal.theme?.requireEmailGate !== false;

            // Only require email gate if not yet verified
            if (emailGateEnabled && !viewerData) {
                setRequiresEmailGate(true);
            }

            setProposal(data.proposal);
            setAccepted(data.proposal.status === 'accepted');

            if (data.proposal.content) {
                const blocks = data.proposal.content;
                if (blocks && blocks.length > 0) {
                    editor.replaceBlocks(editor.document, blocks);
                }
            }

            if (data.proposal.calculator_data?.clientSignatureUrl) {
                setClientSignatureUrl(data.proposal.calculator_data.clientSignatureUrl);
            }

            trackView(data.proposal.id, data.linkId);
            loadComments(data.proposal.id);

        } catch (err: any) {
            console.error('Failed to load proposal:', err);
            setError(err.message || 'Failed to load proposal');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async (proposalId: number) => {
        try {
            const data = await api.getComments(proposalId);
            setComments(organizeComments(data.comments || []));
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const organizeComments = (allComments: Comment[]): Comment[] => {
        const commentMap = new Map<number, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create map of all comments
        allComments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: organize into tree structure
        allComments.forEach(comment => {
            const commentWithReplies = commentMap.get(comment.id)!;
            if (comment.parent_comment_id) {
                const parent = commentMap.get(comment.parent_comment_id);
                if (parent) {
                    parent.replies = parent.replies || [];
                    parent.replies.push(commentWithReplies);
                }
            } else {
                rootComments.push(commentWithReplies);
            }
        });

        return rootComments;
    };

    const trackView = async (proposalId: number, linkId: number) => {
        try {
            const response = await api.trackView({
                proposalId,
                linkId,
                userAgent: navigator.userAgent,
            });
            setViewId(response.viewId);
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !commenterName.trim() || !proposal) return;

        try {
            setIsPosting(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/proposals/${proposal.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    author_name: commenterName,
                    highlighted_text: highlightedText || undefined
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            await loadComments(proposal.id);
            setNewComment('');
            setHighlightedText(null);
            setShowCommentForm(false);
            toast.success('Comment added successfully!');
        } catch (error) {
            console.error('Failed to post comment:', error);
            toast.error('Failed to post comment');
        } finally {
            setIsPosting(false);
        }
    };

    const handleReply = async (parentId: number) => {
        if (!replyText.trim() || !commenterName.trim() || !proposal) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/proposals/${proposal.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyText,
                    author_name: commenterName,
                    parent_comment_id: parentId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add reply');
            }

            await loadComments(proposal.id);
            setReplyText('');
            setReplyingTo(null);
            toast.success('Reply added successfully!');
        } catch (error) {
            console.error('Failed to post reply:', error);
            toast.error('Failed to post reply');
        }
    };

    const handleAccept = async () => {
        if (!proposal) return;

        // Validate signature
        if (!clientSignatureUrl) {
            toast.error('Please provide your signature before accepting');
            // Scroll to signature section
            document.getElementById('signature-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        try {
            setAccepting(true);
            await api.acceptProposal(proposal.id, token);
            setAccepted(true);

            // Navigate to success page with proposal data
            navigate(`/proposal-accepted/${token}`, {
                state: { proposal }
            });
        } catch (error) {
            console.error('Failed to accept proposal:', error);
            toast.error('Failed to accept proposal');
        } finally {
            setAccepting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!proposal) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/pdf/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: proposal.client_name,
                    ...proposal.calculator_data,
                    coverPhotoUrl: proposal.cover_photo_url,
                    calculatorType: proposal.calculator_type
                }),
            });

            if (!response.ok) throw new Error('PDF generation failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${proposal.title || 'Proposal'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    const handleClearSignature = () => {
        sigCanvas.current?.clear();
    };

    const handleSaveDrawnSignature = async () => {
        if (!sigCanvas.current || !proposal) return;

        try {
            const dataUrl = sigCanvas.current.toDataURL();
            setClientSignatureUrl(dataUrl);
            toast.success('Signature saved!');
        } catch (error) {
            console.error('Failed to save signature:', error);
            toast.error('Failed to save signature');
        }
    };

    const renderComment = (comment: Comment, depth: number = 0) => {
        const isReplying = replyingTo === comment.id;

        return (
            <div key={comment.id} className={`${depth > 0 ? 'ml-10 mt-3 pl-4 border-l-2 border-gray-100' : 'p-4 hover:bg-gray-50/50 transition-colors rounded-xl'}`}>
                <div className="flex items-start gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${depth === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-400'}`}>
                        {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{comment.author_name}</span>
                            <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>

                        {comment.highlighted_text && (
                            <div className="bg-amber-50 border-l-2 border-amber-400 p-2.5 rounded-r-lg mb-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                                    <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">Referencing</span>
                                </div>
                                <p className="text-xs text-amber-900 italic line-clamp-2 pl-1">"{comment.highlighted_text}"</p>
                            </div>
                        )}

                        <div className="text-sm text-gray-700 leading-relaxed mb-2.5 whitespace-pre-wrap">{comment.content}</div>

                        <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors group"
                        >
                            <Reply className="w-3 h-3 group-hover:scale-110 transition-transform" />
                            Reply
                        </button>
                    </div>
                </div>

                {isReplying && (
                    <div className="mt-3 ml-11 bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-500">Replying to {comment.author_name}</p>
                            <button
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={commenterName}
                            onChange={(e) => setCommenterName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <textarea
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleReply(comment.id)}
                                disabled={!replyText.trim() || !commenterName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Post Reply
                            </button>
                        </div>
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {comment.replies.map(reply => renderComment(reply, depth + 1))}
                    </div>
                )}
            </div>
        );
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
            </div>
        );
    }

    if (requiresPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Password Protected</h2>
                    <p className="text-gray-500 mb-6 text-center">This proposal is password protected. Please enter the password to view it.</p>
                    <form onSubmit={(e) => { e.preventDefault(); loadProposal(); }}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-[#3b82f6] text-white py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors"
                        >
                            View Proposal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Show email gate if required and viewer hasn't been verified yet
    if (requiresEmailGate && !viewerData && proposalMeta) {
        const handleViewerVerified = async (data: { email: string; name: string; company?: string }) => {
            setViewerData(data);
            // Also set the commenter name for comments
            setCommenterName(data.name);

            // Register the viewer and create a session
            if (proposal) {
                try {
                    const result = await api.registerViewer(proposal.id, data);
                    if (result.sessionId) {
                        setViewerSessionId(result.sessionId);
                        startTime.current = Date.now();
                    }
                } catch (error) {
                    console.error('Failed to register viewer:', error);
                }
            }

            setRequiresEmailGate(false);
        };

        return (
            <EmailGate
                proposalTitle={proposalMeta.title}
                clientName={proposalMeta.clientName}
                onVerified={handleViewerVerified}
            />
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Proposal</h2>
                    <p className="text-gray-500">{error || 'Proposal not found'}</p>
                </div>
            </div>
        );
    }

    const { calculator_data: data } = proposal;
    const totals = data.totals || {};

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl text-gray-900 truncate">
                        {proposal.title}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        {accepted ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                                <CheckCircle className="w-5 h-5" />
                                Accepted
                            </div>
                        ) : (
                            <button
                                onClick={handleAccept}
                                disabled={accepting}
                                className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Accept Proposal
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0">
                        {/* Cover Photo */}
                        {proposal.cover_photo_url && (
                            <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
                                <img
                                    src={proposal.cover_photo_url}
                                    alt="Proposal Cover"
                                    className="w-full h-64 object-cover"
                                />
                            </div>
                        )}

                        <div className="mb-8"><PricingSummary proposal={proposal} /></div>

                        {/* Deliverables Section */}
                        <DeliverablesSection proposal={proposal} />

                        {/* Scope Section */}
                        <ScopeSection proposal={proposal} />

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
                            <BlockNoteView editor={editor} theme="light" editable={false} />
                        </div>

                        <div id="signature-section" className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-8">
                            <div className="flex items-center gap-2 mb-8 text-gray-900 font-semibold text-sm uppercase tracking-wider">
                                <PenTool className="w-4 h-4" />
                                Signatures
                            </div>
                            <div className="grid grid-cols-2 gap-16">
                                {/* Client Signature */}
                                <div className="space-y-4">
                                    <div className="h-48 border-b border-gray-200 border-dashed flex flex-col justify-end pb-2 relative">
                                        {clientSignatureUrl ? (
                                            <div className="relative group h-full flex items-end justify-center">
                                                <img src={clientSignatureUrl} alt="Client Signature" className="max-h-32 object-contain" />
                                                <button
                                                    onClick={() => setClientSignatureUrl(null)}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col">
                                                <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 relative hover:border-blue-200 transition-colors group">
                                                    <SignatureCanvas
                                                        ref={sigCanvas}
                                                        penColor="#1a1a1a"
                                                        canvasProps={{
                                                            className: 'w-full h-full rounded-xl cursor-crosshair'
                                                        }}
                                                    />
                                                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={handleClearSignature}
                                                            className="p-2 bg-white text-gray-500 rounded-lg shadow-sm hover:bg-gray-50 border border-gray-200 hover:text-gray-700 transition-colors"
                                                            title="Clear Signature"
                                                        >
                                                            <Eraser className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={handleSaveDrawnSignature}
                                                            className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="w-3 h-3" />
                                                            Adopt Signature
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-3 left-3 pointer-events-none">
                                                        <span className="text-[10px] font-medium text-gray-400 bg-white/80 px-2 py-1 rounded-md border border-gray-100">Sign Here</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">{proposal.client_name}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">Client Signature</p>
                                    </div>
                                </div>
                                {/* Agency Signature */}
                                <div className="space-y-4">
                                    <div className="h-48 border-b border-gray-200 border-dashed flex items-end justify-center pb-2">
                                        {data.agencySignatureUrl ? (
                                            <img src={data.agencySignatureUrl} alt="Agency Signature" className="max-h-32 object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                                    <PenTool className="w-5 h-5 opacity-50" />
                                                </div>
                                                <span className="text-xs italic">Pending agency signature</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">Your Representative</p>
                                        <p className="text-gray-500 text-xs mt-0.5">Agency Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-80 flex-shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Investment Summary</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600 text-sm">Monthly Investment</span>
                                        <span className="font-bold text-gray-900">${Math.round(totals.monthlyTotal || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600 text-sm">Setup Fee</span>
                                        <span className="font-bold text-gray-900">${(totals.setupTotal || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 text-sm">Annual Value</span>
                                        <span className="font-bold text-[#3b82f6]">${Math.round(totals.annualTotal || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Included Services</h4>
                                    <ul className="space-y-1.5 text-sm text-gray-600">
                                        {proposal.calculator_type === 'marketing' && (
                                            <>
                                                {data.selectedServices?.traffic && <li>- Traffic Driver (Tier {data.selectedServices.traffic})</li>}
                                                {data.selectedServices?.retention && <li>- Retention & CRM (Tier {data.selectedServices.retention})</li>}
                                                {data.selectedServices?.creative && <li>- Creative Support (Tier {data.selectedServices.creative})</li>}
                                                {data.addOns?.landingPages > 0 && <li>- {data.addOns.landingPages} Landing Pages</li>}
                                                {data.addOns?.funnels > 0 && <li>- {data.addOns.funnels} Funnels</li>}
                                            </>
                                        )}
                                        {proposal.calculator_type === 'custom' && (
                                            <li>Custom pricing package</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div ref={commentSectionRef} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Comments ({comments.length})</span>
                                    </div>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto">
                                    {comments.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                            <p className="text-sm text-gray-500">No comments yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Select text to add a comment</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {comments.map(comment => renderComment(comment, 0))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50">
                                    <AnimatePresence mode="wait">
                                        {showCommentForm ? (
                                            <motion.form
                                                key="comment-form"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                onSubmit={handleSubmitComment}
                                                className="space-y-4"
                                            >
                                                {highlightedText && (
                                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-sm">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Selected Text</span>
                                                        </div>
                                                        <p className="text-xs text-amber-900 italic line-clamp-3 pl-1 border-l-2 border-amber-300">"{highlightedText}"</p>
                                                    </div>
                                                )}
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Your Name (Required)"
                                                        value={commenterName}
                                                        onChange={(e) => setCommenterName(e.target.value)}
                                                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                                                        required
                                                    />
                                                    <textarea
                                                        placeholder="What's on your mind?"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all bg-gray-50 focus:bg-white min-h-[100px]"
                                                        rows={3}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="submit"
                                                        disabled={isPosting}
                                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
                                                    >
                                                        {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        Post Comment
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowCommentForm(false);
                                                            setHighlightedText(null);
                                                            setNewComment('');
                                                        }}
                                                        className="px-4 py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </motion.form>
                                        ) : (
                                            <motion.button
                                                key="comment-button"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                onClick={() => setShowCommentForm(true)}
                                                className="w-full px-4 py-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group shadow-sm"
                                            >
                                                <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                <span className="font-medium">Add a comment...</span>
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acceptance Confirmation Modal */}
            <AnimatePresence>
                {showAcceptanceModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowAcceptanceModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Accepted!</h2>
                                <p className="text-gray-600 mb-6">
                                    Thank you for accepting this proposal. We've received your signature and will be in touch soon.
                                </p>
                                {clientSignatureUrl && (
                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Signature</p>
                                        <img src={clientSignatureUrl} alt="Your Signature" className="max-h-20 mx-auto object-contain" />
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowAcceptanceModal(false)}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
