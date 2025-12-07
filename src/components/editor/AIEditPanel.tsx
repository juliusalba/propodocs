import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Sparkles, X, Loader2, Wand2, Check, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import type { CalculatorSchema, CalculatorTier, CalculatorAddOn } from '../../types/calculator';

interface AIEditPanelProps {
    schema: CalculatorSchema;
    onSchemaUpdate: (schema: CalculatorSchema) => void;
}

export function AIEditPanel({ schema, onSchemaUpdate }: AIEditPanelProps) {
    const editor = useEditor();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [instruction, setInstruction] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editor.showAIPanel && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editor.showAIPanel]);

    useEffect(() => {
        // Reset state when selected block changes
        setInstruction('');
        setPreviewData(null);
        setError(null);
    }, [editor.selectedBlock?.id]);

    if (!editor.showAIPanel || !editor.selectedBlock) {
        return null;
    }

    const { type, id, data } = editor.selectedBlock;
    const blockName = type === 'tier' ? (data as CalculatorTier).name : (data as CalculatorAddOn).name;

    const handleApplyChanges = async () => {
        if (!instruction.trim()) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Call the API to modify the block using AI
            const response = await api.editCalculatorBlock({
                blockType: type,
                blockData: data,
                instruction: instruction.trim(),
                fullSchema: schema,
            });

            if (response.updatedBlock) {
                setPreviewData(response.updatedBlock);
            }
        } catch (err: any) {
            console.error('AI edit failed:', err);
            setError(err.message || 'Failed to process AI request');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        if (!previewData) return;

        // Update the schema with the new block data
        let updatedSchema = { ...schema };

        if (type === 'tier' && updatedSchema.tiers) {
            updatedSchema.tiers = updatedSchema.tiers.map(tier =>
                tier.id === id ? { ...tier, ...previewData } : tier
            );
        } else if (type === 'addon' && updatedSchema.addOns) {
            updatedSchema.addOns = updatedSchema.addOns.map(addon =>
                addon.id === id ? { ...addon, ...previewData } : addon
            );
        }

        onSchemaUpdate(updatedSchema);
        editor.clearSelection();
    };

    const handleCancel = () => {
        setPreviewData(null);
        setInstruction('');
        editor.clearSelection();
    };

    const handleReset = () => {
        setPreviewData(null);
        setInstruction('');
        setError(null);
    };

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">Edit with AI</span>
                </div>
                <button
                    onClick={handleCancel}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Selected Block Info */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selected</div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${type === 'tier' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                        {type === 'tier' ? 'Tier' : 'Add-on'}
                    </span>
                    {blockName}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Preview of changes */}
                {previewData && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                        <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Preview Changes
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                            {type === 'tier' && (
                                <>
                                    <div><strong>Name:</strong> {previewData.name}</div>
                                    <div><strong>Price:</strong> ${previewData.monthlyPrice?.toLocaleString()}/mo</div>
                                    {previewData.features && (
                                        <div>
                                            <strong>Features:</strong>
                                            <ul className="list-disc list-inside ml-2 text-xs">
                                                {previewData.features.slice(0, 3).map((f: string, i: number) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                                {previewData.features.length > 3 && (
                                                    <li className="text-gray-500">+{previewData.features.length - 3} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                            {type === 'addon' && (
                                <>
                                    <div><strong>Name:</strong> {previewData.name}</div>
                                    <div><strong>Price:</strong> ${previewData.price?.toLocaleString()}</div>
                                    <div><strong>Description:</strong> {previewData.description}</div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Instruction Input */}
                {!previewData && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe the changes you want
                        </label>
                        <textarea
                            ref={inputRef}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder={type === 'tier'
                                ? 'e.g., "Change price to $9,500 and add Lead nurturing to features"'
                                : 'e.g., "Change price to $3,000 and update description"'
                            }
                            className="w-full h-24 px-3 py-2 border border-gray-200 rounded-xl resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm"
                            disabled={isProcessing}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    {previewData ? (
                        <>
                            <button
                                onClick={handleReset}
                                className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Apply
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApplyChanges}
                                disabled={isProcessing || !instruction.trim()}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        Generate
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
