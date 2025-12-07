import { useState, useEffect } from 'react';
import { X, Calendar, User, RotateCcw, Loader2 } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface VersionPreviewModalProps {
    proposalId: number;
    versionId: number;
    isOpen: boolean;
    onClose: () => void;
    onRestore?: (versionContent: any) => void;
}

export function VersionPreviewModal({
    proposalId,
    versionId,
    isOpen,
    onClose,
    onRestore
}: VersionPreviewModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState<any>(null);
    const [proposalTitle, setProposalTitle] = useState('');
    const [editorReady, setEditorReady] = useState(false);

    const editor = useCreateBlockNote();

    useEffect(() => {
        if (isOpen && versionId) {
            setEditorReady(false);
            loadVersion();
        }
    }, [isOpen, versionId]);

    useEffect(() => {
        if (version?.content && editor && !editorReady) {
            try {
                const blocks = version.content;
                if (blocks && blocks.length > 0) {
                    editor.replaceBlocks(editor.document, blocks);
                    setEditorReady(true);
                }
            } catch (error) {
                console.error('Failed to load version content into editor:', error);
            }
        }
    }, [version, editor, editorReady]);

    const loadVersion = async () => {
        try {
            setLoading(true);
            const response = await api.getProposalVersion(proposalId, versionId);
            setVersion(response.version);
            setProposalTitle(response.proposalTitle);
        } catch (error) {
            console.error('Failed to load version:', error);
            toast.error('Failed to load version');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = () => {
        if (version && onRestore) {
            onRestore(version.content);
            toast.success('Version restored successfully!');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
                >
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#CD8417]/10 rounded-lg">
                                <RotateCcw className="w-5 h-5 text-[#CD8417]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Version History</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Viewing snapshot of {proposalTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {version && !loading && (
                        <div className="px-8 py-4 bg-white border-b border-gray-100 flex items-center gap-8 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#8C0000]/10 flex items-center justify-center text-[#8C0000]">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saved On</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {new Date(version.timestamp).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-gray-100" />
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#CD8417]/10 flex items-center justify-center text-[#CD8417]">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saved By</p>
                                    <p className="text-sm font-semibold text-gray-900">{version.author || 'Unknown'}</p>
                                </div>
                            </div>
                            {version.title && (
                                <>
                                    <div className="w-px h-8 bg-gray-100" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Version Note</p>
                                        <p className="text-sm text-gray-900 truncate">{version.title}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-8 min-h-0 bg-white custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-[#8C0000]" />
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <BlockNoteView
                                    editor={editor}
                                    editable={false}
                                    theme="light"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            You are viewing a historical version
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            {onRestore && (
                                <button
                                    onClick={handleRestore}
                                    className="px-5 py-2.5 bg-[#8C0000] text-white rounded-xl hover:bg-[#A00000] transition-all flex items-center gap-2 font-medium text-sm shadow-lg shadow-[#8C0000]/20"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Restore This Version
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
