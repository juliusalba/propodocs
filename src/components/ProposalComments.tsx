import { useState, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronRight, Check, Reply, Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import type { ProposalComment } from '../types';

import { useAuth } from '../contexts/AuthContext';

interface ProposalCommentsProps {
    proposalId: number;
    highlightedText: string | null;
    activeBlockId: string | null;
    activeBlockType?: string | null;
    onClearHighlight: () => void;
}

export function ProposalComments({ proposalId, highlightedText, activeBlockId, activeBlockType, onClearHighlight }: ProposalCommentsProps) {
    const toast = useToast();
    const { user } = useAuth();
    const [comments, setComments] = useState<ProposalComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filterByBlock, setFilterByBlock] = useState(false);

    // Auto-refresh comments every 10 seconds to catch new guest comments
    useEffect(() => {
        loadComments();
        const interval = setInterval(loadComments, 10000);
        return () => clearInterval(interval);
    }, [proposalId]);

    // Reset filter when block changes
    useEffect(() => {
        if (!activeBlockId) {
            setFilterByBlock(false);
        }
    }, [activeBlockId]);

    useEffect(() => {
        if (highlightedText) {
            setShowForm(true);
        }
    }, [highlightedText]);

    const loadComments = async () => {
        try {
            setLoading(true);
            // Always load all comments
            const data = await api.getComments(proposalId);

            let commentsToShow = data.comments;

            // Filter by block if toggle is enabled and a block is active
            if (filterByBlock && activeBlockId) {
                commentsToShow = commentsToShow.filter(
                    (c: ProposalComment) => c.block_id === activeBlockId
                );
            }

            const organized = organizeComments(commentsToShow);
            setComments(organized);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const organizeComments = (allComments: ProposalComment[]): ProposalComment[] => {
        const commentMap = new Map<number, ProposalComment>();
        const rootComments: ProposalComment[] = [];

        allComments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsPosting(true);
            await api.addComment(proposalId, {
                content: newComment,
                author_name: user?.name || 'Anonymous',
                highlighted_text: highlightedText || undefined,
                block_id: activeBlockId || undefined
            });

            await loadComments();
            setNewComment('');
            onClearHighlight();
            toast.success('Comment added!');
        } catch (error) {
            console.error('Failed to post comment:', error);
            toast.error('Failed to post comment');
        } finally {
            setIsPosting(false);
        }
    };

    const handleReply = async (parentId: number) => {
        if (!replyText.trim()) return;

        try {
            await api.addComment(proposalId, {
                content: replyText,
                author_name: user?.name || 'Anonymous',
                parent_comment_id: parentId,
                block_id: activeBlockId || undefined
            });

            await loadComments();
            setReplyText('');
            setReplyingTo(null);
            toast.success('Reply added!');
        } catch (error) {
            console.error('Failed to post reply:', error);
            toast.error('Failed to post reply');
        }
    };

    const handleResolve = async (commentId: number, isResolved: boolean) => {
        try {
            await api.resolveComment(proposalId, commentId, !isResolved);
            await loadComments();
        } catch (error) {
            console.error('Failed to resolve comment:', error);
        }
    };

    const toggleComment = (commentId: number) => {
        const newExpanded = new Set(expandedComments);
        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);
        }
        setExpandedComments(newExpanded);
    };

    const renderComment = (comment: ProposalComment, depth = 0) => {
        const isExpanded = expandedComments.has(comment.id);
        const isReplying = replyingTo === comment.id;
        const hasReplies = comment.replies && comment.replies.length > 0;

        return (
            <div key={comment.id} className={`relative ${depth > 0 ? 'ml-6 mt-3' : ''}`}>
                {/* Threading line for replies */}
                {depth > 0 && (
                    <div className="absolute -left-4 top-0 bottom-0 w-px bg-gray-200" />
                )}
                {depth > 0 && (
                    <div className="absolute -left-4 top-4 w-4 h-px bg-gray-200" />
                )}

                <div className={`p-3 rounded-xl transition-all border ${comment.is_resolved ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                            {comment.author_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {comment.author_name}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        })}
                                    </span>
                                </div>
                                {comment.is_resolved && (
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
                                        <Check className="w-3 h-3" />
                                        Resolved
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-700 leading-relaxed">
                                {comment.content}
                            </p>

                            {comment.highlighted_text && (
                                <div className="mt-2 bg-amber-50/50 border-l-2 border-amber-400 pl-3 py-1 rounded-r">
                                    <p className="text-xs text-amber-800 italic font-medium">
                                        "{comment.highlighted_text}"
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-4 mt-3">
                                <button
                                    onClick={() => setReplyingTo(comment.id)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <Reply className="w-3.5 h-3.5" />
                                    Reply
                                </button>

                                {depth === 0 && (
                                    <button
                                        onClick={() => handleResolve(comment.id, comment.is_resolved || false)}
                                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.is_resolved
                                            ? 'text-gray-500 hover:text-gray-700'
                                            : 'text-green-600 hover:text-green-700'
                                            }`}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        {comment.is_resolved ? 'Unresolve' : 'Resolve'}
                                    </button>
                                )}

                                {hasReplies && (
                                    <button
                                        onClick={() => toggleComment(comment.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 ml-auto"
                                    >
                                        {isExpanded ? (
                                            <>Hide replies <ChevronDown className="w-3 h-3" /></>
                                        ) : (
                                            <>Show {comment.replies?.length} replies <ChevronRight className="w-3 h-3" /></>
                                        )}
                                    </button>
                                )}
                            </div>

                            {isReplying && (
                                <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <textarea
                                        placeholder={`Reply to ${comment.author_name}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            className="px-3 py-1.5 text-gray-600 text-xs font-medium hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleReply(comment.id)}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isExpanded && hasReplies && (
                    <div className="mt-1 relative">
                        {/* Vertical line connecting parent to children */}
                        <div className="absolute left-4 top-0 bottom-4 w-px bg-gray-200" />
                        {comment.replies?.map(reply => renderComment(reply, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments ({comments.length})</span>
                    </div>
                    {activeBlockId && (
                        <button
                            onClick={() => setFilterByBlock(!filterByBlock)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${filterByBlock
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {filterByBlock ? 'This Block' : 'All Comments'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                    <div className="p-4 flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-500">No comments yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {activeBlockId ? 'Click to add a comment to this block' : 'Select a block to add comments'}
                        </p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {comments.map(comment => renderComment(comment))}
                    </div>
                )}
            </div>

            {(highlightedText || activeBlockId || showForm) && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {highlightedText && (
                            <div className="bg-amber-50 border-l-2 border-amber-400 p-2 rounded-r">
                                <p className="text-xs text-amber-800 italic line-clamp-2">
                                    "{highlightedText}"
                                </p>
                            </div>
                        )}
                        {!highlightedText && activeBlockType === 'image' && (
                            <div className="bg-blue-50 border-l-2 border-blue-400 p-2 rounded-r">
                                <p className="text-xs text-blue-800 font-medium flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    Commenting on Image
                                </p>
                            </div>
                        )}

                        <textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                            rows={3}
                            required
                        />

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isPosting}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Comment
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setNewComment('');
                                    setShowForm(false);
                                    onClearHighlight();
                                }}
                                className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
