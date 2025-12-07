import { useState, useRef } from 'react';
import { Upload, PenTool, Eraser, CheckCircle, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface SignatureInputProps {
    value: string | null;
    onChange: (signatureUrl: string | null) => void;
    label?: string;
}

export function SignatureInput({ value, onChange, label = "Signature" }: SignatureInputProps) {
    const [mode, setMode] = useState<'draw' | 'upload'>('draw');
    const [uploading, setUploading] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const handleClear = () => {
        sigCanvas.current?.clear();
    };

    const handleSaveDrawn = () => {
        if (!sigCanvas.current) return;

        if (sigCanvas.current.isEmpty()) {
            toast.error('Please draw your signature first');
            return;
        }

        const dataUrl = sigCanvas.current.toDataURL();
        onChange(dataUrl);
        toast.success('Signature saved!');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.uploadFile(formData);
            onChange(response.url);
            toast.success('Signature uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload signature:', error);
            toast.error('Failed to upload signature');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    return (
        <div className="space-y-4">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Mode Toggle */}
            {!value && (
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setMode('draw')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${mode === 'draw'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <PenTool className="w-4 h-4" />
                        Draw
                    </button>
                    <button
                        onClick={() => setMode('upload')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${mode === 'upload'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                </div>
            )}

            {/* Signature Display or Input */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden">
                {value ? (
                    <div className="relative group bg-gray-50">
                        <div className="h-32 flex items-center justify-center p-4">
                            <img
                                src={value}
                                alt="Signature"
                                className="max-h-full object-contain"
                            />
                        </div>
                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : mode === 'draw' ? (
                    <div className="relative bg-white">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="#1a1a1a"
                            canvasProps={{
                                className: 'w-full h-32 cursor-crosshair',
                            }}
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                            <button
                                onClick={handleClear}
                                className="p-2 bg-white text-gray-500 rounded-lg shadow-sm hover:bg-gray-50 border border-gray-200 hover:text-gray-700 transition-colors"
                                title="Clear Signature"
                            >
                                <Eraser className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleSaveDrawn}
                                className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Save Signature
                            </button>
                        </div>
                        <div className="absolute top-3 left-3 pointer-events-none">
                            <span className="text-xs font-medium text-gray-400 bg-white/80 px-2 py-1 rounded-md border border-gray-100">
                                Sign Here
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="h-32 flex flex-col items-center justify-center p-4 bg-gray-50">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-500">Uploading...</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                                >
                                    Choose File
                                </button>
                                <p className="text-xs text-gray-400 mt-2">
                                    PNG, JPG up to 2MB
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
