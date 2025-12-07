import { useState, useEffect } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Pencil, X, Check, Plus, Trash2 } from 'lucide-react';
import type { CalculatorSchema } from '../../types/calculator';

interface ManualEditPanelProps {
    schema: CalculatorSchema;
    onSchemaUpdate: (schema: CalculatorSchema) => void;
}

export function ManualEditPanel({ schema, onSchemaUpdate }: ManualEditPanelProps) {
    const editor = useEditor();
    const [editData, setEditData] = useState<any>(null);

    useEffect(() => {
        if (editor.selectedBlock) {
            setEditData({ ...editor.selectedBlock.data });
        }
    }, [editor.selectedBlock]);

    if (!editor.showManualPanel || !editor.selectedBlock || !editData) {
        return null;
    }

    const { type, id } = editor.selectedBlock;
    const isTier = type === 'tier';

    const handleSave = () => {
        let updatedSchema = { ...schema };

        if (isTier && updatedSchema.tiers) {
            updatedSchema.tiers = updatedSchema.tiers.map(tier =>
                tier.id === id ? { ...tier, ...editData } : tier
            );
        } else if (!isTier && updatedSchema.addOns) {
            updatedSchema.addOns = updatedSchema.addOns.map(addon =>
                addon.id === id ? { ...addon, ...editData } : addon
            );
        }

        onSchemaUpdate(updatedSchema);
        editor.clearSelection();
    };

    const handleCancel = () => {
        editor.clearSelection();
    };

    const handleAddFeature = () => {
        if (isTier) {
            setEditData({
                ...editData,
                features: [...(editData.features || []), ''],
            });
        }
    };

    const handleRemoveFeature = (index: number) => {
        if (isTier) {
            setEditData({
                ...editData,
                features: editData.features.filter((_: any, i: number) => i !== index),
            });
        }
    };

    const handleFeatureChange = (index: number, value: string) => {
        if (isTier) {
            const newFeatures = [...editData.features];
            newFeatures[index] = value;
            setEditData({ ...editData, features: newFeatures });
        }
    };

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-white">
                    <Pencil className="w-5 h-5" />
                    <span className="font-semibold">Edit {isTier ? 'Tier' : 'Add-on'}</span>
                </div>
                <button
                    onClick={handleCancel}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Name
                    </label>
                    <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        placeholder="Enter name"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description
                    </label>
                    <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm resize-none"
                        rows={3}
                        placeholder="Enter description"
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {isTier ? 'Monthly Price' : 'Price'}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            value={isTier ? (editData.monthlyPrice || 0) : (editData.price || 0)}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isTier) {
                                    setEditData({ ...editData, monthlyPrice: value });
                                } else {
                                    setEditData({ ...editData, price: value });
                                }
                            }}
                            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Tier-specific fields */}
                {isTier && (
                    <>
                        {/* Setup Fee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Setup Fee (Optional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={editData.setupFee || 0}
                                    onChange={(e) => setEditData({ ...editData, setupFee: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700">
                                    Features
                                </label>
                                <button
                                    onClick={handleAddFeature}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Feature
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(editData.features || []).map((feature: string, index: number) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={feature}
                                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                            placeholder="Feature description"
                                        />
                                        <button
                                            onClick={() => handleRemoveFeature(index)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!editData.features || editData.features.length === 0) && (
                                    <p className="text-sm text-gray-400 italic">No features yet. Click "Add Feature" to add one.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Addon-specific fields */}
                {!isTier && (
                    <>
                        {/* Price Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Price Type
                            </label>
                            <select
                                value={editData.priceType || 'monthly'}
                                onChange={(e) => setEditData({ ...editData, priceType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="one-time">One-time</option>
                                <option value="per-unit">Per Unit</option>
                            </select>
                        </div>

                        {/* Allow Quantity */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allowQuantity"
                                checked={editData.allowQuantity || false}
                                onChange={(e) => setEditData({ ...editData, allowQuantity: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="allowQuantity" className="text-sm text-gray-700">
                                Allow quantity selection
                            </label>
                        </div>
                    </>
                )}
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Check className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
