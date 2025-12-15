import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { type PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "../styles/table-enhancements.css";
import "../styles/editor-enhancements.css";
import {
    Save,
    Loader2,
    ArrowLeft,
    Calculator,
    Share,
    PenTool,
    X,
    Sparkles,
    History,
    Clock,
    Eye,
    Upload,
    Copy,
    ExternalLink,
    ScanSearch
} from 'lucide-react';
import { useToast } from '../components/Toast';

import { api } from "../lib/api";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { AIAssistant } from "../components/AIAssistant";
import { CopywritingScanner } from "../components/CopywritingScanner";
import { PricingSummary } from "../components/PricingSummary";
import { ProposalComments } from "../components/ProposalComments";
import { VersionPreviewModal } from "../components/VersionPreviewModal";
import { type Proposal } from "../types";
import { useAuth } from '../contexts/AuthContext';
import { ShareModal } from '../components/ShareModal';
import { TableToolbar } from '../components/TableToolbar';
import { ViewAnalyticsModal } from '../components/ViewAnalyticsModal';
import { CoverPhotoUpload } from '../components/CoverPhotoUpload';
import { DeliverablesSection } from '../components/DeliverablesSection';
import { ScopeSection } from '../components/ScopeSection';
import { useAutoSave } from '../hooks/useAutoSave';
import { SaveStatus } from '../components/SaveStatus';


export function ProposalEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isBlankMode = searchParams.get('mode') === 'blank';
    const toast = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [proposalTitle, setProposalTitle] = useState("");
    const [agencySignatureUrl, setAgencySignatureUrl] = useState<string | null>(null);
    const [, setUploadSignature] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [generatingAI, setGeneratingAI] = useState(false);
    const [highlightedText, setHighlightedText] = useState<string | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'comments' | 'versions' | 'scanner'>('comments');
    const [versions, setVersions] = useState<any[]>([]);
    const [previewVersionId, setPreviewVersionId] = useState<number | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [activeBlockType, setActiveBlockType] = useState<string | null>(null);
    const [commentedBlocks, setCommentedBlocks] = useState<Set<string>>(new Set());
    const [initialBlockStates, setInitialBlockStates] = useState<Record<string, any>>({});
    const [showTableToolbar, setShowTableToolbar] = useState(false);
    const [isInTable, setIsInTable] = useState(false);
    const [selectedProposalForAnalytics, setSelectedProposalForAnalytics] = useState<number | null>(null);
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);

    // Initialize the editor
    const editor = useCreateBlockNote({
        uploadFile: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.uploadFile(formData);
            return response.url;
        }
    });

    // Auto-save hook (after editor initialization)
    // Memoize data for auto-save to prevent unnecessary re-renders
    const autoSaveData = useMemo(() => ({
        content: editor?.document,
        title: proposalTitle,
        cover_photo_url: coverPhotoUrl,
        calculator_data: {
            ...proposal?.calculator_data,
            agencySignatureUrl
        }
    }), [editor?.document, proposalTitle, coverPhotoUrl, proposal?.calculator_data, agencySignatureUrl]);

    // Auto-save hook
    const autoSaveStatus = useAutoSave({
        key: `proposal-${id}`,
        data: autoSaveData,
        onSave: async (data) => {
            if (!id) return;
            await api.updateProposal(Number(id), data);
        },
        enabled: !!id && !!proposal,
    });

    // Track active block
    useEffect(() => {
        if (editor) {
            const updateActiveBlock = () => {
                // Try text cursor position first
                const textCursor = editor.getTextCursorPosition();
                if (textCursor && textCursor.block) {
                    setActiveBlockId(textCursor.block.id);
                    setActiveBlockType(textCursor.block.type);
                    // Check if we're in a table
                    const block = textCursor.block;
                    const inTable = block.type === 'table';
                    setIsInTable(inTable);
                    setShowTableToolbar(inTable);
                    return;
                }

                // Fallback to block selection (e.g. for images)
                const selection = editor.getSelection();
                if (selection && selection.blocks.length > 0) {
                    const block = selection.blocks[0];
                    setActiveBlockId(block.id);
                    setActiveBlockType(block.type);
                    const inTable = block.type === 'table';
                    setIsInTable(inTable);
                    setShowTableToolbar(inTable);
                }
            };

            const unsubscribe = editor.onSelectionChange(updateActiveBlock);
            return () => {
                // @ts-ignore - Unsubscribe might be void or function depending on version
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            };
        }
    }, [editor]);

    // Handle loading existing proposal or creating blank proposal
    useEffect(() => {
        const initializeProposal = async () => {
            if (id && !isNaN(Number(id))) {
                // Load existing proposal
                loadProposal(Number(id));
            } else if (isBlankMode) {
                // Create new blank proposal
                try {
                    setLoading(true);
                    const response = await api.createProposal({
                        title: 'Untitled Proposal',
                        clientName: 'New Client',
                        clientEmail: '',
                        calculatorType: 'manual',
                        calculatorData: {
                            totals: { monthlyTotal: 0, annualTotal: 0 },
                            lineItems: [],
                            description: ''
                        },
                        content: []
                    });

                    if (response?.proposal?.id) {
                        // Navigate to the new proposal's edit page
                        navigate(`/proposals/${response.proposal.id}/edit`, { replace: true });
                    } else {
                        toast.error('Failed to create proposal');
                        navigate('/proposals');
                    }
                } catch (error) {
                    console.error('Failed to create blank proposal:', error);
                    toast.error('Failed to create proposal');
                    navigate('/proposals');
                }
            } else {
                // No id and not blank mode - redirect to proposals
                setLoading(false);
            }
        };

        initializeProposal();
    }, [id, isBlankMode]);

    // Load user's saved signature on mount
    useEffect(() => {
        if (user?.signature_url && !agencySignatureUrl) {
            setAgencySignatureUrl(user.signature_url);
        }
    }, [user]);

    // Handle text selection for comments
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) {
                const text = selection.toString().trim();
                if (text.length > 0) {
                    setHighlightedText(text);
                    return;
                }
            }
        };

        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, []);

    // Handle table keyboard shortcuts
    useEffect(() => {
        const handleTableKeyboard = (e: KeyboardEvent) => {
            if (!isInTable || !editor) return;

            // Check if we're in a table cell
            const target = e.target as HTMLElement;
            const isInTableCell = target.closest('td') || target.closest('th');

            if (!isInTableCell) return;

            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Shift+Enter: Insert line break within cell
                    // Let default behavior handle this (BlockNote supports this natively)
                    return;
                } else {
                    // Enter: Create new row below
                    e.preventDefault();
                    try {
                        const selection = editor.getTextCursorPosition();
                        if (selection && selection.block && selection.block.type === 'table') {
                            // BlockNote's table API - add row
                            // This is a simplified version - actual implementation depends on BlockNote's API
                            console.log('Adding new row to table');
                            // You may need to use editor's table manipulation methods here
                        }
                    } catch (error) {
                        console.error('Error adding table row:', error);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleTableKeyboard);
        return () => document.removeEventListener('keydown', handleTableKeyboard);
    }, [isInTable, editor]);

    const loadProposal = async (proposalId: number) => {
        try {
            setLoading(true);
            const response = await api.getProposal(proposalId);
            if (!response || !response.proposal) {
                throw new Error("Invalid response from server");
            }
            const proposalData = response.proposal;
            setProposal(proposalData);
            setProposalTitle(proposalData.title || "");

            if (proposalData.calculator_data?.agencySignatureUrl) {
                setAgencySignatureUrl(proposalData.calculator_data.agencySignatureUrl);
            }

            // Load cover photo
            if (proposalData.cover_photo_url) {
                setCoverPhotoUrl(proposalData.cover_photo_url);
            }

            if (proposalData.content) {
                // If content exists, we'll use it. 
                const blocks = proposalData.content as PartialBlock[];
                if (blocks && blocks.length > 0) {
                    const currentBlocks = editor.document;
                    editor.replaceBlocks(currentBlocks, blocks);
                }
            }

            // Load versions from calculator_data
            if (proposalData.calculator_data?.versions) {
                setVersions(proposalData.calculator_data.versions);
            }

            // Load comments to identify commented blocks and store initial state
            const commentsData = await api.getComments(proposalId);
            const blockIds = new Set<string>(commentsData.comments
                .filter((c: any) => c.block_id)
                .map((c: any) => c.block_id));
            setCommentedBlocks(blockIds);

            if (proposalData.content) {
                const blocks = proposalData.content as any[];
                const initialStates: Record<string, any> = {};
                blocks.forEach((block: any) => {
                    if (block.id && blockIds.has(block.id)) {
                        initialStates[block.id] = JSON.parse(JSON.stringify(block));
                    }
                });
                setInitialBlockStates(initialStates);
            }
        } catch (error) {
            console.error("Failed to load proposal:", error);
            toast.error("Failed to load proposal");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;

        try {
            setSaving(true);
            const content = editor.document;

            // Check for changes in commented blocks
            const nextInitialStates = { ...initialBlockStates };
            for (const block of content) {
                if (commentedBlocks.has(block.id)) {
                    const initialState = nextInitialStates[block.id];
                    const currentState = JSON.parse(JSON.stringify(block));

                    if (initialState && JSON.stringify(initialState) !== JSON.stringify(currentState)) {
                        await api.trackBlockChange(Number(id), block.id, {
                            previous_content: initialState,
                            new_content: currentState
                        });
                        nextInitialStates[block.id] = currentState;
                    }
                }
            }
            setInitialBlockStates(nextInitialStates);

            await api.updateProposal(Number(id), {
                content: content,
                title: proposalTitle,
                cover_photo_url: coverPhotoUrl,
                // Merge with existing calculator data to preserve other fields
                calculator_data: {
                    ...proposal?.calculator_data,
                    agencySignatureUrl
                }
            });
            // Optional: Show success toast
        } catch (error) {
            console.error("Failed to save proposal:", error);
            toast.error("Failed to save proposal");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveVersion = async () => {
        if (!id || !proposal) return;

        try {
            setSaving(true);
            const content = editor.document;
            const newVersion = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                content: content,
                title: proposalTitle,
                author: 'Current User' // TODO: Get from auth context
            };

            const updatedVersions = [...versions, newVersion];
            setVersions(updatedVersions);

            await api.updateProposal(Number(id), {
                content: content,
                title: proposalTitle,
                cover_photo_url: coverPhotoUrl,
                calculator_data: {
                    ...proposal?.calculator_data,
                    agencySignatureUrl,
                    versions: updatedVersions
                }
            });

            toast.success('Version saved successfully!');
        } catch (error) {
            console.error("Failed to save version:", error);
            toast.error("Failed to save version");
        } finally {
            setSaving(false);
        }
    };

    const handleLoadVersion = (version: any) => {
        if (confirm('Loading this version will replace your current content. Continue?')) {
            const blocks = version.content as PartialBlock[];
            if (blocks && blocks.length > 0) {
                const currentBlocks = editor.document;
                editor.replaceBlocks(currentBlocks, blocks);
            }
            setProposalTitle(version.title || proposalTitle);
            setActiveSidebarTab('versions');
        }
    };

    const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadSignature(true);
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.uploadFile(formData);
            setAgencySignatureUrl(response.url);
        } catch (error) {
            console.error('Failed to upload signature:', error);
            toast.error('Failed to upload signature');
        } finally {
            setUploadSignature(false);
        }
    };

    const handleEditServices = () => {
        if (!proposal) return;

        let path: string;
        if (proposal.calculator_type === 'custom') {
            // For custom calculators, we need the calculator definition ID
            const calculatorDefId = proposal.calculator_data?.calculatorDefinitionId;
            if (calculatorDefId) {
                path = `/calculator/custom/${calculatorDefId}?id=${proposal.id}`;
            } else {
                toast.error('Calculator definition not found');
                return;
            }
        } else {
            // Default to marketing calculator
            path = `/calculator/marketing?id=${proposal.id}`;
        }

        navigate(path);
    };

    // Load existing share link on mount
    useEffect(() => {
        const loadShareLink = async () => {
            if (!id) return;
            try {
                const linksData = await api.getLinks(Number(id));
                const publicLink = linksData.links?.find((l: any) => !l.revoked_at);
                if (publicLink) {
                    setShareLink(`${window.location.origin}/p/${publicLink.token}`);
                }
            } catch (error) {
                console.error("Failed to load share link:", error);
            }
        };
        loadShareLink();
    }, [id]);

    const handleShare = async () => {
        if (!id) return;
        try {
            // Check for existing links
            const linksData = await api.getLinks(Number(id));
            let link = linksData.links?.find((l: any) => !l.revoked_at);

            if (!link) {
                // Create new link
                const result = await api.createLink(Number(id), { type: 'view' });
                link = result.link;
            }

            const url = `${window.location.origin}/p/${link.token}`;
            setShareLink(url);
            setShowShareModal(true);
        } catch (error) {
            console.error("Failed to generate share link:", error);
            toast.error("Failed to generate share link");
        }
    };



    const handleAIReplace = (text: string) => {
        if (editor && editor.document.length > 0) {
            try {
                // Use BlockNote's updateBlock method to safely modify the last block
                const lastBlockIndex = editor.document.length - 1;
                const lastBlock = editor.document[lastBlockIndex];

                // Get existing content and add new text
                const currentContent = Array.isArray(lastBlock.content) ? lastBlock.content : [];
                const newContent = [
                    ...currentContent,
                    {
                        type: 'text' as const,
                        text: text,
                        styles: {}
                    }
                ];

                // Update the block with new content
                editor.updateBlock(lastBlock, { content: newContent });

                // Focus the editor
                editor.focus();

            } catch (error) {
                console.warn('Failed to replace text with BlockNote API:', error);
                // Alternative approach: append to the last block's text
                try {
                    const lastBlock = editor.document[editor.document.length - 1];
                    if (lastBlock && Array.isArray(lastBlock.content)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const existingText = lastBlock.content
                            .filter((item: any) => item.type === 'text')
                            .map((item: any) => item.text)
                            .join(' ');

                        const newText = existingText + ' ' + text;
                        const newContent = [{
                            type: 'text' as const,
                            text: newText,
                            styles: {}
                        }];

                        editor.updateBlock(lastBlock, { content: newContent });
                    }
                } catch (fallbackError) {
                    console.error('BlockNote methods failed:', fallbackError);
                    console.log('AI-generated text:', text);
                }
            }
        }
    };

    const getSelectedText = () => {
        return window.getSelection()?.toString() || '';
    };

    const getFullText = () => {
        let text = '';

        // 1. Get editor content
        if (editor) {
            editor.document.forEach(block => {
                if (Array.isArray(block.content)) {
                    block.content.forEach(inline => {
                        if (inline.type === 'text') {
                            text += inline.text;
                        }
                    });
                    text += '\n';
                }
            });
        }

        // 2. Add Scope of Work content if available
        if (proposal?.calculator_data?.scopeOfWork) {
            text += '\nScope of Work:\n';
            // Handle array of strings or array of objects
            const scope = proposal.calculator_data.scopeOfWork;
            if (Array.isArray(scope)) {
                scope.forEach((item: any) => {
                    if (typeof item === 'string') {
                        text += item + '\n';
                    } else if (item.description) {
                        text += item.description + '\n';
                    }
                });
            }
        }

        return text;
    };

    const hasMinimalContent = () => {
        const content = getFullText().trim();
        return content.length < 50; // Less than 50 characters indicates minimal content
    };

    const generateAIProposal = async () => {
        if (!proposal || !id) return;

        try {
            setGeneratingAI(true);

            // Create a comprehensive prompt based on proposal data
            const prompt = `Create a professional proposal introduction and overview for ${proposal.client_name || 'the client'} based on the following details:

Client: ${proposal.client_name || 'N/A'}
Company: ${proposal.client_company || 'N/A'}
Calculator Type: ${proposal.calculator_type || 'Standard'}
Services: ${JSON.stringify(proposal.calculator_data, null, 2)}

Please write a compelling, professional proposal with proper structure:
1. Use markdown headings (# for main heading, ## for sections)
2. Acknowledge the client's specific needs
3. Introduce Propodocs value proposition 
4. Reference their selected services/solutions
5. Set expectations for the partnership
6. Use a warm, professional tone

Keep it concise but impactful - around 300-400 words with proper headings and sections.`;

            // Call the AI enhancement API
            const response = await api.enhanceContent('', prompt);
            const generatedContent = response.enhancedContent;

            if (generatedContent) {
                // Parse content and create BlockNote blocks with proper formatting
                const lines = generatedContent.split('\n');
                const blocks: any[] = [];

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Skip empty lines unless they're between content blocks
                    if (!line.trim()) {
                        // Only add empty paragraph if we have content before and after
                        if (i > 0 && i < lines.length - 1 && lines[i + 1]?.trim()) {
                            continue; // Skip empty lines, BlockNote handles spacing
                        }
                        continue;
                    }

                    // Detect headings
                    if (line.startsWith('### ')) {
                        blocks.push({
                            type: 'heading',
                            props: { level: 3 },
                            content: [{
                                type: 'text' as const,
                                text: line.replace('### ', '').trim(),
                                styles: {}
                            }]
                        });
                    } else if (line.startsWith('## ')) {
                        blocks.push({
                            type: 'heading',
                            props: { level: 2 },
                            content: [{
                                type: 'text' as const,
                                text: line.replace('## ', '').trim(),
                                styles: {}
                            }]
                        });
                    } else if (line.startsWith('# ')) {
                        blocks.push({
                            type: 'heading',
                            props: { level: 1 },
                            content: [{
                                type: 'text' as const,
                                text: line.replace('# ', '').trim(),
                                styles: {}
                            }]
                        });
                    } else {
                        // Regular paragraph
                        blocks.push({
                            type: 'paragraph',
                            content: [{
                                type: 'text' as const,
                                text: line.trim(),
                                styles: {}
                            }]
                        });
                    }
                }

                // Replace the current content with AI-generated content
                const currentBlocks = editor.document;
                editor.replaceBlocks(currentBlocks, blocks);

                // Auto-save after generation
                await handleSave();
            }
        } catch (error) {
            console.error('AI generation failed:', error);
            toast.error('Failed to generate AI proposal content. Please try again.');
        } finally {
            setGeneratingAI(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#8C0000]" />
            </div>
        );
    }

    return (
        <DashboardLayout fullScreen={true}>
            <div className="h-full flex flex-col bg-white overflow-hidden">
                {/* Header */}
                <div className="px-8 py-5 flex items-center justify-between bg-white/80 backdrop-blur-sm z-10 border-b border-gray-100 sticky top-0">
                    <div className="flex items-center gap-6 flex-1">
                        <button
                            onClick={() => navigate('/proposals')}
                            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 max-w-xl">
                            <input
                                type="text"
                                value={proposalTitle}
                                onChange={(e) => setProposalTitle(e.target.value)}
                                className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder-gray-300 tracking-tight"
                                placeholder="Untitled Proposal"
                            />
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                    {proposal?.client_name || 'No Client'}
                                </span>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-400">
                                    Edited {new Date(proposal?.updated_at || '').toLocaleDateString()}
                                </span>
                                {proposal && proposal.view_count !== undefined && proposal.view_count > 0 && (
                                    <>
                                        <span className="text-xs text-gray-300">•</span>
                                        <button
                                            onClick={() => setSelectedProposalForAnalytics(proposal.id)}
                                            className="flex items-center gap-1.5 text-xs text-[#8C0000] hover:text-[#A00000] font-medium transition-colors hover:bg-[#8C0000]/5 px-2 py-0.5 rounded-md"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            {proposal.view_count} {proposal.view_count === 1 ? 'view' : 'views'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleEditServices}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
                        >
                            <Calculator className="w-4 h-4" />
                            Services
                        </button>

                        <button
                            onClick={() => setActiveSidebarTab('scanner')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${activeSidebarTab === 'scanner' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <ScanSearch className="w-4 h-4" />
                            Scan Copy
                        </button>

                        {/* Quick Actions */}
                        {shareLink && (
                            <>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareLink);
                                        toast.success('Link copied to clipboard');
                                    }}
                                    className="flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
                                    title="Copy Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => window.open(shareLink, '_blank')}
                                    className="flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
                                    title="Preview Proposal"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <div className="h-8 w-px bg-gray-100 mx-1" />
                            </>
                        )}

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
                        >
                            <Share className="w-4 h-4" />
                            Share
                        </button>
                        <div className="h-8 w-px bg-gray-100 mx-1" />

                        {/* Auto-save status indicator */}
                        <SaveStatus
                            status={autoSaveStatus.status}
                            lastSaved={autoSaveStatus.lastSaved}
                            error={autoSaveStatus.error}
                        />

                        <div className="h-8 w-px bg-gray-100 mx-1" />
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 font-medium text-sm"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={handleSaveVersion}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-50 font-medium text-sm shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20"
                        >
                            <History className="w-4 h-4" />
                            Save Version
                        </button>
                    </div>
                </div>

                {/* Editor Area with Sidebar */}
                <div className="flex-1 flex overflow-hidden bg-white min-h-0 relative flex-col lg:flex-row">
                    {/* Main Editor */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-12 min-h-full bg-white">
                            {/* Cover Photo Upload */}
                            <div className="mb-8">
                                <CoverPhotoUpload
                                    currentPhotoUrl={coverPhotoUrl}
                                    onPhotoChange={setCoverPhotoUrl}
                                />
                            </div>

                            {/* Pricing Summary Block */}
                            <PricingSummary proposal={proposal} />

                            {/* Deliverables Section */}
                            {proposal && <DeliverablesSection proposal={proposal} />}

                            {/* Scope Section */}
                            {proposal && <ScopeSection proposal={proposal} />}

                            <div className="py-4 relative">
                                {/* Table Toolbar */}
                                <TableToolbar editor={editor} show={showTableToolbar} />

                                <BlockNoteView editor={editor} theme="light" />

                                {hasMinimalContent() && (
                                    <div className="mt-8 p-6 bg-gradient-to-br from-[#8C0000]/5 to-[#FFC917]/5 rounded-2xl border border-[#8C0000]/10 backdrop-blur-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-[#CD8417]" />
                                                    AI Assistant
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1 max-w-md">
                                                    Generate a professional, tailored proposal introduction based on your client's details.
                                                </p>
                                            </div>
                                            <button
                                                onClick={generateAIProposal}
                                                disabled={generatingAI}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#8C0000] border border-[#8C0000]/20 rounded-xl hover:bg-[#8C0000]/5 hover:border-[#8C0000]/30 transition-all disabled:opacity-50 font-medium text-sm shadow-sm"
                                            >
                                                {generatingAI ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4" />
                                                )}
                                                {generatingAI ? 'Generating...' : 'Auto-Generate'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* E-Signature Block */}
                            <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-6 sm:mb-8 text-gray-900 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                                    <PenTool className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Signatures
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
                                    <div className="space-y-4">
                                        <div className="h-24 border-b border-gray-200 border-dashed flex items-end pb-2">
                                            <span className="text-gray-300 text-sm italic">Client signs here</span>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-semibold text-gray-900">{proposal?.client_name || 'Client Name'}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">Client Signature</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-24 border-b border-gray-200 border-dashed flex items-end justify-center pb-2 relative group hover:border-gray-300 transition-colors">
                                            {agencySignatureUrl ? (
                                                <>
                                                    <img src={agencySignatureUrl} alt="Agency Signature" className="h-20 object-contain" />
                                                    <button
                                                        onClick={() => setAgencySignatureUrl(null)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors group-hover:scale-105 transform duration-200">
                                                        <Upload className="w-5 h-5" />
                                                        <span className="text-xs font-medium">Upload Signature</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleUploadSignature}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    {user?.signature_url && (
                                                        <button
                                                            onClick={() => setAgencySignatureUrl(user.signature_url || null)}
                                                            className="absolute bottom-2 right-0 text-[10px] font-medium text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-md transition-colors"
                                                        >
                                                            Use Default
                                                        </button>
                                                    )}
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
                    </div>

                    {/* Right Sidebar - Comments & Version History */}
                    <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-100 bg-white flex flex-col max-h-96 lg:max-h-none">
                        {/* Tabs */}
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            <button
                                onClick={() => setActiveSidebarTab('comments')}
                                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeSidebarTab === 'comments'
                                    ? 'text-[#8C0000] border-b-2 border-[#8C0000]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Comments
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('versions')}
                                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeSidebarTab === 'versions'
                                    ? 'text-[#8C0000] border-b-2 border-[#8C0000]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Versions
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('scanner')}
                                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeSidebarTab === 'scanner'
                                    ? 'text-[#8C0000] border-b-2 border-[#8C0000]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Scanner
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            {activeSidebarTab === 'comments' && (
                                <div className="h-full">
                                    {id && (
                                        <ProposalComments
                                            proposalId={Number(id)}
                                            highlightedText={highlightedText}
                                            activeBlockId={activeBlockId}
                                            activeBlockType={activeBlockType}
                                            onClearHighlight={() => setHighlightedText(null)}
                                        />
                                    )}
                                </div>
                            )}

                            {activeSidebarTab === 'versions' && (
                                <div className="h-full overflow-y-auto p-4">
                                    {versions.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p>No versions saved yet</p>
                                            <p className="text-xs mt-1">Click "Save Version" to create a snapshot</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {[...versions].reverse().map((version, index) => (
                                                <div
                                                    key={version.id}
                                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-sm text-gray-900">
                                                                Version {versions.length - index}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {new Date(version.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                                        {version.title || 'Untitled'}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewVersionId(version.id);
                                                                setShowPreviewModal(true);
                                                            }}
                                                            className="flex-1 px-3 py-1.5 text-xs font-medium text-[#3b82f6] bg-white border border-[#3b82f6] rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLoadVersion(version);
                                                            }}
                                                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#3b82f6] rounded hover:bg-[#1d4ed8] transition-colors"
                                                        >
                                                            Restore
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSidebarTab === 'scanner' && (
                                <CopywritingScanner
                                    getText={getFullText}
                                    editor={editor}
                                />
                            )}
                        </div>
                    </div >
                </div >

                {/* Share Modal */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    proposalId={id || ''}
                    proposalTitle={proposalTitle}
                    clientName={proposal?.client_name || 'Client'}
                    shareUrl={shareLink}
                />

                <AIAssistant
                    onReplace={handleAIReplace}
                    getSelectedText={getSelectedText}
                />


            </div>

            {/* Version Preview Modal */}
            {
                id && previewVersionId !== null && (
                    <VersionPreviewModal
                        proposalId={Number(id)}
                        versionId={previewVersionId as number}
                        isOpen={showPreviewModal}
                        onClose={() => {
                            setShowPreviewModal(false);
                            setPreviewVersionId(null);
                        }}
                        onRestore={(versionContent) => {
                            if (editor && versionContent) {
                                editor.replaceBlocks(editor.document, versionContent);
                                toast.success('Version restored! Don\'t forget to save.');
                            }
                        }}
                    />
                )
            }

            {/* Analytics Modal */}
            {selectedProposalForAnalytics && (
                <ViewAnalyticsModal
                    proposalId={selectedProposalForAnalytics}
                    isOpen={!!selectedProposalForAnalytics}
                    onClose={() => setSelectedProposalForAnalytics(null)}
                />
            )}
        </DashboardLayout >
    );
}
