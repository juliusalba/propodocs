import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DynamicCalculator } from '../components/calculators/DynamicCalculator';
import { EditableDynamicCalculator } from '../components/calculators/EditableDynamicCalculator';
import { DocumentUploader } from '../components/calculators/DocumentUploader';
import { ScreenshotUploader } from '../components/calculators/ScreenshotUploader';
import { VoiceRecorder } from '../components/calculators/VoiceRecorder';
import { SchemaCodeEditor } from '../components/editor/SchemaCodeEditor';
import { AIEditPanel } from '../components/editor/AIEditPanel';
import { ManualEditPanel } from '../components/editor/ManualEditPanel';
import { CalculatorPreviewModal } from '../components/calculators/CalculatorPreviewModal';
import { EditorProvider, useEditor } from '../contexts/EditorContext';
import type { CalculatorSchema, CalculatorRow, CalculatorTheme } from '../types/calculator';
import { Wand2, Save, Loader2, ArrowLeft, FileText, Image, Mic, MessageSquare, Eye, Pencil, Code, Palette, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

type InputMethod = 'text' | 'document' | 'screenshot' | 'voice';
type ViewMode = 'view' | 'edit' | 'code';

// Inner component that uses EditorContext
function CalculatorBuilderInner() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const toast = useToast();
    const editor = useEditor();

    const [inputMethod, setInputMethod] = useState<InputMethod>('text');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [schema, setSchema] = useState<CalculatorSchema | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [previewData, setPreviewData] = useState<CalculatorRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('edit');
    const [showFullPagePreview, setShowFullPagePreview] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchCalculator = async () => {
                setIsLoading(true);
                try {
                    const data = await api.getCalculator(id);
                    setName(data.name);
                    setDescription(data.description || '');
                    setSchema(data.schema);
                } catch (error) {
                    console.error('Error fetching calculator:', error);
                    toast.error('Failed to load calculator');
                    navigate('/calculators');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCalculator();
        }
    }, [id, navigate, toast]);

    // Sync edit mode with viewMode
    useEffect(() => {
        editor.setEditMode(viewMode === 'edit');
        editor.setShowCodeView(viewMode === 'code');
    }, [viewMode, editor]);

    const handleGenerate = async (textInput: string) => {
        if (!textInput.trim()) return;

        setIsGenerating(true);
        try {
            const data = await api.generateCalculatorSchema(textInput);
            setSchema(data);
            toast.success('Calculator schema generated!');
        } catch (error) {
            console.error('Error generating calculator:', error);
            toast.error('Failed to generate calculator schema');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDocumentProcessed = (extractedText: string) => {
        setPrompt(extractedText);
        setInputMethod('text');
        handleGenerate(extractedText);
    };

    const handleScreenshotProcessed = (extractedData: string) => {
        setPrompt(extractedData);
        handleGenerate(extractedData);
    };

    const handleVoiceTranscription = (transcript: string) => {
        setPrompt(transcript);
        handleGenerate(transcript);
    };

    const handleSchemaUpdate = useCallback((newSchema: CalculatorSchema) => {
        setSchema(newSchema);
    }, []);

    const handleSave = async () => {
        if (!schema || !name.trim() || !user) return;

        setIsSaving(true);
        try {
            if (id) {
                await api.updateCalculator(id, {
                    name,
                    description,
                    schema,
                });
                toast.success('Calculator updated successfully!');
            } else {
                await api.createCalculator({
                    name,
                    description,
                    schema,
                });
                toast.success('Calculator saved successfully!');
            }
            navigate('/calculators');
        } catch (error) {
            console.error('Error saving calculator:', error);
            toast.error('Failed to save calculator');
        } finally {
            setIsSaving(false);
        }
    };

    const inputMethods = [
        { id: 'text' as InputMethod, label: 'Text Input', icon: MessageSquare, color: '[#050505]' },
        { id: 'document' as InputMethod, label: 'Upload File', icon: FileText, color: '[#050505]' },
        { id: 'screenshot' as InputMethod, label: 'Screenshot', icon: Image, color: '[#050505]' },
        { id: 'voice' as InputMethod, label: 'Voice', icon: Mic, color: '[#050505]' },
    ];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8C0000]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Navigating to /calculators');
                        navigate('/calculators');
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Calculators
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">
                    {id ? 'Edit Calculator' : 'Create Custom Calculator'}
                </h1>
                <p className="text-gray-500 mt-1">Use AI to build a calculator from your description, document, or voice.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Methods */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <Wand2 className="text-[#CD8417]" size={20} />
                            {id ? 'Update Design with AI' : 'Choose Input Method'}
                        </h2>

                        {/* Method Tabs */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {inputMethods.map((method) => {
                                const Icon = method.icon;
                                const isActive = inputMethod === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setInputMethod(method.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${isActive
                                            ? `border-[#8C0000] bg-[#8C0000]/5`
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mb-2 ${isActive ? `text-[#8C0000]` : 'text-gray-400'}`} />
                                        <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {method.label}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="space-y-4">
                            {inputMethod === 'text' && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Describe your calculator</label>
                                    <textarea
                                        className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 placeholder:text-gray-400 focus:border-[#8C0000] focus:ring-2 focus:ring-[#8C0000]/10 focus:outline-none resize-none transition-all"
                                        placeholder="e.g. I offer social media management with 3 tiers. I need columns for Service Name, Platform (Instagram, LinkedIn), Frequency, and Price."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleGenerate(prompt)}
                                        disabled={isGenerating || !prompt.trim()}
                                        className="w-full mt-4 bg-[#8C0000] hover:bg-[#A00000] text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#8C0000]/20 hover:shadow-[#8C0000]/30"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-5 h-5" />
                                                Generate Calculator
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {inputMethod === 'document' && (
                                <DocumentUploader
                                    onFileProcessed={handleDocumentProcessed}
                                    onError={(error) => toast.error(error)}
                                />
                            )}

                            {inputMethod === 'screenshot' && (
                                <ScreenshotUploader
                                    onFileProcessed={handleScreenshotProcessed}
                                    onError={(error) => toast.error(error)}
                                />
                            )}

                            {inputMethod === 'voice' && (
                                <VoiceRecorder
                                    onTranscriptionComplete={handleVoiceTranscription}
                                    onError={(error) => toast.error(error)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Save Section */}
                    {schema && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Save Calculator</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Calculator Name *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8C0000] focus:ring-2 focus:ring-[#8C0000]/10 focus:outline-none transition-all"
                                        placeholder="e.g. Social Media Pricing"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Description (optional)</label>
                                    <textarea
                                        className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8C0000] focus:ring-2 focus:ring-[#8C0000]/10 focus:outline-none resize-none transition-all"
                                        placeholder="Brief description of this calculator"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Theme Selector */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Palette className="w-4 h-4" />
                                            Theme
                                        </div>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { id: 'light', label: 'Light', colors: 'bg-white border-gray-300 text-gray-900' },
                                            { id: 'dark', label: 'Dark', colors: 'bg-gray-900 border-gray-700 text-white' },
                                            { id: 'brand', label: 'Brand', colors: 'bg-[#8C0000] border-[#500000] text-white' }
                                        ] as const).map((themeOption) => (
                                            <button
                                                key={themeOption.id}
                                                onClick={() => setSchema({ ...schema, theme: themeOption.id as CalculatorTheme })}
                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${themeOption.colors} ${(schema.theme || 'light') === themeOption.id
                                                    ? 'ring-2 ring-offset-2 ring-[#8C0000]'
                                                    : 'opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                {themeOption.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !name.trim()}
                                    className="w-full bg-[#8C0000] hover:bg-[#A00000] text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#8C0000]/20 hover:shadow-[#8C0000]/30"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            {id ? 'Update Calculator' : 'Save Calculator'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Preview with View Mode Toggle */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                        {/* Header with View Toggle */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-900">Preview</h2>

                            <div className="flex items-center gap-3">
                                {/* View Mode Toggle */}
                                <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('view')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'view'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('edit')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'edit'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setViewMode('code')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'code'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Code className="w-4 h-4" />
                                        Code
                                    </button>
                                </div>

                                {/* Full Page Preview Button */}
                                {schema && (
                                    <button
                                        onClick={() => setShowFullPagePreview(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Full-page preview"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[500px]">
                            {!schema ? (
                                <div className="flex items-center justify-center h-[500px]">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Wand2 className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium mb-1">No calculator generated yet</p>
                                        <p className="text-gray-500 text-sm">
                                            Choose an input method and provide your calculator details
                                        </p>
                                    </div>
                                </div>
                            ) : viewMode === 'code' ? (
                                <div className="h-[500px]">
                                    <SchemaCodeEditor
                                        schema={schema}
                                        onChange={handleSchemaUpdate}
                                    />
                                </div>
                            ) : viewMode === 'edit' ? (
                                <div className="bg-gray-50">
                                    <EditableDynamicCalculator
                                        schema={schema}
                                        onSchemaUpdate={handleSchemaUpdate}
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl border border-gray-200 m-4">
                                    <DynamicCalculator
                                        schema={schema}
                                        initialData={previewData}
                                        onChange={setPreviewData}
                                        theme="light"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Edit Panel (floating) */}
            {schema && (
                <>
                    <AIEditPanel
                        schema={schema}
                        onSchemaUpdate={setSchema}
                    />
                    <ManualEditPanel
                        schema={schema}
                        onSchemaUpdate={setSchema}
                    />
                </>
            )}

            {/* Full Page Preview Modal */}
            {schema && (
                <CalculatorPreviewModal
                    isOpen={showFullPagePreview}
                    onClose={() => setShowFullPagePreview(false)}
                    schema={schema}
                    theme={schema.theme || 'light'}
                />
            )}
        </DashboardLayout>
    );
}

// Exported component wrapped with EditorProvider
export const CalculatorBuilder: React.FC = () => {
    return (
        <EditorProvider>
            <CalculatorBuilderInner />
        </EditorProvider>
    );
};
