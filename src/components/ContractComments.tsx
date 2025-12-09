import { useState, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronRight, Check, Reply, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
    id: number;
    contract_id: number;
    user_id?: number | string;
    author_name: string;
    content: string;
    parent_comment_id?: number;
    is_resolved?: boolean;
    is_internal: boolean;
    created_at: string;
    replies?: Comment[];
}

interface ContractCommentsProps {
    contractId: number;
}

export function ContractComments({ contractId }: ContractCommentsProps) {
    const toast = useToast();
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);

    // Auto-refresh comments every 10 seconds to catch new guest comments
    useEffect(() => {
        loadComments();
        const interval = setInterval(loadComments, 10000);
        return () => clearInterval(interval);
    }, [contractId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const response = await api.getContractComments(contractId);
            const organized = organizeComments(response.comments || []);
            setComments(organized);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const organizeComments = (allComments: Comment[]): Comment[] => {
        const commentMap = new Map<number, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create copies of all comments
        allComments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: link children to parents
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
            await api.addContractComment(contractId, {
                content: newComment,
                author_name: user?.name || 'Anonymous',
                is_internal: isInternal
            });

            await loadComments();
            setNewComment('');
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
            await api.addContractComment(contractId, {
                content: replyText,
                author_name: user?.name || 'Anonymous',
                parent_comment_id: parentId,
                is_internal: isInternal
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
            await api.resolveContractComment(contractId, commentId, !isResolved);
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

    const renderComment = (comment: Comment, depth = 0) => {
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

                <div className={`p-3 rounded-xl transition-all border ${comment.is_internal ? 'bg-yellow-50 border-yellow-100' : 'bg-white border-gray-100'} ${comment.is_resolved ? 'opacity-75' : 'hover:border-blue-200 hover:shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${comment.is_internal ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                            {comment.author_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {comment.author_name}
                                    </span>
                                    {comment.is_internal && (
                                        <span className="text-[10px] font-medium text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full border border-yellow-200">
                                            Internal
                                        </span>
                                    )}
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
                                    <div className="flex items-center justify-between mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isInternal}
                                                onChange={(e) => setIsInternal(e.target.checked)}
                                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-600">Internal Note</span>
                                        </label>
                                        <div className="flex gap-2">
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
        <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200 w-80 lg:w-96 flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MessageSquare className="w-4 h-4" />
                    <span>Contract Comments ({comments.length})</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500">No comments yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Start a discussion about this contract
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map(comment => renderComment(comment))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        required
                    />

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isInternal}
                                onChange={(e) => setIsInternal(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600 font-medium">Internal Note</span>
                        </label>

                        <button
                            type="submit"
                            disabled={isPosting}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Post
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
