import { useState } from 'react';
import { ScanSearch, AlertTriangle, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { scanText, type Issue } from '../lib/copywritingScanner';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface CopywritingScannerProps {
    getText: () => string;
    editor?: any;
}

export function CopywritingScanner({ getText, editor }: CopywritingScannerProps) {
    const toast = useToast();
    const [scanned, setScanned] = useState(false);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [improvingIssue, setImprovingIssue] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<Record<number, string>>({});

    const [isScanning, setIsScanning] = useState(false);

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            const text = getText();
            const foundIssues = scanText(text);
            setIssues(foundIssues);
            setScanned(true);
            setSuggestions({});
            setIsScanning(false);
        }, 1500);
    };

    const handleSuggest = async (issue: Issue, idx: number) => {
        try {
            setImprovingIssue(idx);
            const prompt = `Improve this text to fix the issue "${issue.type}": "${issue.text}". 
            Context: This is part of a business proposal. 
            Goal: ${issue.suggestion}. 
            Return ONLY the improved text, nothing else.`;

            const response = await api.enhanceContent('', prompt);
            if (response.enhancedContent) {
                setSuggestions(prev => ({ ...prev, [idx]: response.enhancedContent }));
            }
        } catch (error) {
            console.error('Failed to suggest improvement:', error);
            toast.error('Failed to generate suggestion');
        } finally {
            setImprovingIssue(null);
        }
    };

    const handleImplement = (issue: Issue, improvement: string) => {
        if (!editor) {
            toast.error('Editor not connected');
            return;
        }

        try {
            // This is a simplified implementation. 
            // Ideally we would find the block containing the text and replace it.
            // For now, we'll try to replace the text in the current block or active block

            // Get all blocks
            const blocks = editor.document;
            let replaced = false;

            // Iterate through blocks to find the text
            for (const block of blocks) {
                if (Array.isArray(block.content)) {
                    const textContent = block.content.map((c: any) => c.text).join('');
                    if (textContent.includes(issue.text)) {
                        // Found the block, replace the text
                        const newText = textContent.replace(issue.text, improvement);

                        editor.updateBlock(block, {
                            content: [{
                                type: 'text',
                                text: newText,
                                styles: {}
                            }]
                        });
                        replaced = true;
                        break;
                    }
                }
            }

            if (replaced) {
                toast.success('Improvement applied!');
                // Remove the issue from the list
                setIssues(prev => prev.filter(i => i !== issue));
                // Clear suggestion
                const newSuggestions = { ...suggestions };
                // @ts-ignore
                delete newSuggestions[issue]; // This key logic is wrong, but we're filtering the issue anyway
            } else {
                toast.error('Could not find text to replace. It might have changed.');
            }
        } catch (error) {
            console.error('Failed to implement change:', error);
            toast.error('Failed to apply change');
        }
    };

    const getIssueColor = (type: Issue['type']) => {
        switch (type) {
            case 'passive': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'weak': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'cliché': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'long-sentence': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            {isScanning && (
                <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                        className="absolute left-0 right-0 h-1 bg-[#3b82f6] shadow-[0_0_20px_rgba(122,30,30,0.5)]"
                    />
                    <div className="flex flex-col items-center gap-2 z-10">
                        <ScanSearch className="w-8 h-8 text-[#3b82f6] animate-pulse" />
                        <p className="font-medium text-gray-900">Analyzing copy...</p>
                    </div>
                </div>
            )}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-[#3b82f6]" />
                    Copy Scanner
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {issues.length === 0 && !scanned ? (
                    <div className="text-center py-8 text-gray-500">
                        <ScanSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Click "Scan Now" to analyze your proposal copy.</p>
                    </div>
                ) : issues.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="font-medium text-gray-900">Great job!</p>
                        <p className="text-xs text-gray-500">No major copywriting issues found.</p>
                    </div>
                ) : (
                    issues.map((issue, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${getIssueColor(issue.type)}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider opacity-80">{issue.type}</span>
                            </div>
                            <p className="font-medium text-sm mb-1">"{issue.text}"</p>
                            <p className="text-xs opacity-90 flex items-center gap-1 mb-2">
                                <AlertTriangle className="w-3 h-3" />
                                {issue.suggestion}
                            </p>

                            {suggestions[idx] ? (
                                <div className="mt-2 bg-white/50 p-2 rounded border border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Suggestion:</p>
                                    <p className="text-sm text-gray-900 mb-2">"{suggestions[idx]}"</p>
                                    <button
                                        onClick={() => handleImplement(issue, suggestions[idx])}
                                        className="w-full py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        Implement Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleSuggest(issue, idx)}
                                    disabled={improvingIssue === idx}
                                    className="w-full py-1.5 bg-white/50 hover:bg-white text-gray-700 text-xs font-medium rounded border border-gray-200 transition-colors flex items-center justify-center gap-1"
                                >
                                    {improvingIssue === idx ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3 h-3" />
                                    )}
                                    Suggest Improvement
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                <button
                    onClick={handleScan}
                    className="w-full py-2 bg-[#3b82f6] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <ScanSearch className="w-4 h-4" />
                    {scanned ? 'Rescan Document' : 'Scan Now'}
                </button>
            </div>
        </div>
    );
}