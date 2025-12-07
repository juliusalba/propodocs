import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Send, Globe, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalId: string;
    proposalTitle: string;
    clientName: string;
    shareUrl?: string;
}

export function ShareModal({ isOpen, onClose, proposalId, proposalTitle, clientName, shareUrl: providedShareUrl }: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(`Hi ${clientName},\n\nHere is the proposal for ${proposalTitle}. Please review at your convenience.\n\nBest regards,`);
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expirationType, setExpirationType] = useState<'permanent' | 'days' | 'date'>('permanent');
    const [expirationDays, setExpirationDays] = useState(7);
    const [expirationDate, setExpirationDate] = useState('');
    const toast = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [shareUrl, setShareUrl] = useState(providedShareUrl || '');
    const [loadingLink, setLoadingLink] = useState(false);

    // Fetch or create public link on mount
    useEffect(() => {
        if (providedShareUrl) {
            setShareUrl(providedShareUrl);
            return;
        }

        const fetchLink = async () => {
            if (!proposalId) return;
            setLoadingLink(true);
            try {
                // First try to get existing links
                const { links } = await api.getLinks(Number(proposalId));
                const publicLink = links?.find((l: any) => !l.revoked_at);

                if (publicLink) {
                    setShareUrl(`${window.location.origin}/p/${publicLink.token}`);
                } else {
                    // Create new permanent public link
                    const newLink = await api.createLink(Number(proposalId), {
                        type: 'view',
                        expires_at: null
                    });
                    setShareUrl(`${window.location.origin}/p/${newLink.token}`);
                }
            } catch (error) {
                console.error('Failed to generate share link:', error);
                toast.error('Failed to generate share link');
            } finally {
                setLoadingLink(false);
            }
        };

        if (isOpen) {
            fetchLink();
        }
    }, [proposalId, isOpen, providedShareUrl, toast]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    const handleCopyLink = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const calculateExpiresAt = () => {
        if (expirationType === 'permanent') return null;

        if (expirationType === 'days') {
            const date = new Date();
            date.setDate(date.getDate() + expirationDays);
            return date.toISOString();
        }

        if (expirationType === 'date' && expirationDate) {
            return new Date(expirationDate).toISOString();
        }

        return null;
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const expiresAt = calculateExpiresAt();

            await api.post('/api/email/send', {
                to: email,
                subject: `Proposal: ${proposalTitle}`,
                expiresAt,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a1a1a;">New Proposal Received</h2>
                        <p style="color: #4a4a4a; white-space: pre-wrap;">${message}</p>
                        <div style="margin: 30px 0;">
                            <a href="${shareUrl}" style="background-color: #8C0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Proposal</a>
                        </div>
                        ${expiresAt ? `<p style="color: #888; font-size: 14px;">This link expires on ${new Date(expiresAt).toLocaleDateString()}</p>` : ''}
                        <p style="color: #888; font-size: 12px; margin-top: 40px;">
                            Powered by Pricing Calculator
                        </p>
                    </div>
                `,
                text: `${message}\n\nView Proposal: ${shareUrl}${expiresAt ? `\n\nThis link expires on ${new Date(expiresAt).toLocaleDateString()}` : ''}`
            });
            toast.success('Email sent successfully');
            onClose();
        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    // Get minimum date for date picker (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Share Proposal</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Copy Link Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposal Link</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 truncate flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        {loadingLink ? (
                                            <span className="text-gray-400 italic">Generating link...</span>
                                        ) : (
                                            shareUrl || 'Error generating link'
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors flex items-center gap-2 font-medium text-sm shadow-sm"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Link Expiration Section */}
                            <div className="space-y-3 bg-[#FAF3CD]/50 border border-[#CD8417]/20 rounded-xl p-4">
                                <label className="text-xs font-semibold text-[#8C0000] uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Link Expiration
                                </label>

                                <div className="space-y-3">
                                    {/* Permanent */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="expiration"
                                            value="permanent"
                                            checked={expirationType === 'permanent'}
                                            onChange={() => setExpirationType('permanent')}
                                            className="w-4 h-4 text-[#8C0000] focus:ring-2 focus:ring-[#8C0000]"
                                        />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Permanent (no expiration)</span>
                                    </label>

                                    {/* Expires in X days */}
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="expiration"
                                            value="days"
                                            checked={expirationType === 'days'}
                                            onChange={() => setExpirationType('days')}
                                            className="w-4 h-4 text-[#8C0000] focus:ring-2 focus:ring-[#8C0000]"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <span className="text-sm font-medium text-[#050505] group-hover:text-black">Expires in</span>
                                            {expirationType === 'days' && (
                                                <select
                                                    value={expirationDays}
                                                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white border border-[#CD8417]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000] transition-all text-sm"
                                                >
                                                    <option value={1}>1 day</option>
                                                    <option value={3}>3 days</option>
                                                    <option value={7}>7 days</option>
                                                    <option value={14}>14 days</option>
                                                    <option value={30}>30 days</option>
                                                </select>
                                            )}
                                        </div>
                                    </label>

                                    {/* Expires on specific date */}
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="expiration"
                                            value="date"
                                            checked={expirationType === 'date'}
                                            onChange={() => setExpirationType('date')}
                                            className="w-4 h-4 text-[#8C0000] focus:ring-2 focus:ring-[#8C0000] mt-0.5"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <span className="text-sm font-medium text-[#050505] group-hover:text-black">Expires on</span>
                                            {expirationType === 'date' && (
                                                <input
                                                    type="date"
                                                    value={expirationDate}
                                                    onChange={(e) => setExpirationDate(e.target.value)}
                                                    min={today}
                                                    className="w-full px-3 py-2 bg-white border border-[#CD8417]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000] transition-all text-sm"
                                                />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Or send via email</span>
                                </div>
                            </div>

                            {/* Email Form */}
                            <form onSubmit={handleSendEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="client@example.com"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</label>
                                    <textarea
                                        ref={textareaRef}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none overflow-hidden min-h-[100px]"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full py-3 bg-[#8C0000] text-white rounded-xl font-medium hover:bg-[#A00000] transition-all shadow-lg shadow-[#8C0000]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Proposal
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
