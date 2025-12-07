import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Check, Loader2, LayoutTemplate } from 'lucide-react';
import { api } from '../lib/api';

interface Template {
    id: number;
    name: string;
    description: string;
    content: any;
    is_default: boolean;
}

interface TemplateSelectorProps {
    onSelect: (template: Template | null, useAI: boolean) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function TemplateSelector({ onSelect, onCancel, loading }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await api.getTemplates();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleSelect = (templateId: number) => {
        setSelectedTemplateId(templateId);
    };

    const handleConfirm = () => {
        if (selectedTemplateId === -1) {
            // AI Generation
            onSelect(null, true);
        } else if (selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId);
            onSelect(template || null, false);
        } else {
            // Blank/Basic
            onSelect(null, false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* AI Option */}
                <div
                    onClick={() => handleSelect(-1)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all group ${selectedTemplateId === -1
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedTemplateId === -1 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">Generate with AI</h3>
                            <p className="text-sm text-gray-500">Let AI write a custom proposal based on your calculator inputs</p>
                        </div>
                        {selectedTemplateId === -1 && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                <Check className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Templates */}
                {isLoadingTemplates ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => handleSelect(template.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all group ${selectedTemplateId === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedTemplateId === template.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                                    <p className="text-sm text-gray-500">{template.description}</p>
                                </div>
                                {selectedTemplateId === template.id && (
                                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Blank Option */}
                <div
                    onClick={() => handleSelect(0)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all group ${selectedTemplateId === 0
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedTemplateId === 0 ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">Blank Proposal</h3>
                            <p className="text-sm text-gray-500">Start with a clean slate and write from scratch</p>
                        </div>
                        {selectedTemplateId === 0 && (
                            <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center">
                                <Check className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={selectedTemplateId === null || loading}
                    className="flex-1 px-4 py-2.5 bg-[#3b82f6] text-white font-medium rounded-xl hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Proposal'}
                </button>
            </div>
        </div>
    );
}
