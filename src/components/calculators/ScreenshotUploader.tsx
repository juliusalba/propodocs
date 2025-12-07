import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScreenshotUploaderProps {
    onFileProcessed: (extractedData: string) => void;
    onError: (error: string) => void;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({ onFileProcessed, onError }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            handleFile(droppedFile);
        } else {
            onError('Please upload an image file');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    };

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsProcessing(true);
        setIsComplete(false);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            const response = await fetch('http://localhost:3001/api/uploads/image', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to process image');

            const data = await response.json();
            onFileProcessed(data.extractedData);
            setIsComplete(true);
        } catch (error) {
            console.error('Image processing error:', error);
            onError('Failed to process image. Please try again.');
            setFile(null);
            setPreview(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        setIsComplete(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900 mb-1">
                                    Drop your screenshot here
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse files
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Upload className="w-4 h-4" />
                                <span>Supports PNG, JPG, JPEG up to 10MB</span>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-2 border-purple-200 bg-purple-50 rounded-2xl p-6 space-y-4"
                    >
                        {preview && (
                            <div className="relative rounded-xl overflow-hidden bg-white">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-48 object-contain"
                                />
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                                    ) : isComplete ? (
                                        <CheckCircle2 className="w-6 h-6 text-purple-600" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-purple-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {isProcessing
                                            ? 'Analyzing image...'
                                            : isComplete
                                                ? 'Analysis complete!'
                                                : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                    </p>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button
                                    onClick={handleRemove}
                                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
