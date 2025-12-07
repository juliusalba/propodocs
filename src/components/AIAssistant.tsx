import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Check, X, Briefcase, AlignLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface AIAssistantProps {
    onReplace: (text: string) => void;
    getSelectedText: () => string;
}

export function AIAssistant({ onReplace, getSelectedText }: AIAssistantProps) {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [selection, setSelection] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Check selection periodically or on mouseup
    useEffect(() => {
        const checkSelection = () => {
            const text = getSelectedText();
            if (text && text.trim().length > 0) {
                setSelection(text);
            } else {
                setSelection('');
                setIsOpen(false);
                setResult(null);
            }
        };

        document.addEventListener('selectionchange', checkSelection);
        return () => document.removeEventListener('selectionchange', checkSelection);
    }, [getSelectedText]);

    const handleEnhance = async (instruction: string) => {
        if (!selection) return;

        try {
            setLoading(true);
            const response = await api.enhanceContent(selection, instruction);
            setResult(response.enhancedContent);
        } catch (error) {
            console.error('AI enhancement failed:', error);
            toast.error('Failed to enhance content');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result) {
            onReplace(result);
            setResult(null);
            setIsOpen(false);
        }
    };

    if (!selection) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 pointer-events-none">
            <div className="pointer-events-auto">
                {isOpen && (
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 mb-2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                AI Assistant
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {result ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-purple-50 rounded-lg text-sm text-gray-800 border border-purple-100 max-h-60 overflow-y-auto">
                                    {result}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleApply}
                                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Replace
                                    </button>
                                    <button
                                        onClick={() => setResult(null)}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 mb-2 truncate">Selected: "{selection.substring(0, 40)}..."</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <button onClick={() => handleEnhance('Improve writing and clarity')} disabled={loading} className="text-left px-3 py-2 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors flex items-center gap-2">
                                        <Wand2 className="w-3 h-3" /> Improve Writing
                                    </button>
                                    <button onClick={() => handleEnhance('Make it more professional')} disabled={loading} className="text-left px-3 py-2 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> Professional Tone
                                    </button>
                                    <button onClick={() => handleEnhance('Make it more persuasive')} disabled={loading} className="text-left px-3 py-2 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Persuasive Tone
                                    </button>
                                    <button onClick={() => handleEnhance('Make it shorter')} disabled={loading} className="text-left px-3 py-2 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors flex items-center gap-2">
                                        <AlignLeft className="w-3 h-3" /> Shorten
                                    </button>
                                </div>
                                {loading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center justify-center ${isOpen ? 'bg-gray-100 text-gray-600' : 'bg-purple-600 text-white'
                        }`}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}