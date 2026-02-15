import React, { useState, useRef } from 'react';
import { FileText, Upload, X, Loader2, CheckCircle2, FileSpreadsheet, FileType } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

interface DocumentUploaderProps {
    onFileProcessed: (extractedText: string) => void;
    onError: (error: string) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onFileProcessed, onError }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
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
        if (droppedFile) {
            validateAndProcessFile(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            validateAndProcessFile(selectedFile);
        }
    };

    const validateAndProcessFile = (selectedFile: File) => {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        // Also check extensions as fallback for some OS/browser combos
        const validExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.csv'];
        const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

        if (validTypes.includes(selectedFile.type) || validExtensions.includes(fileExtension)) {
            handleFile(selectedFile);
        } else {
            onError('Please upload a valid document (PDF, DOCX, CSV, Excel)');
        }
    };

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsProcessing(true);
        setIsComplete(false);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const token = localStorage.getItem('auth_token');
            const headers: Record<string, string> = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/uploads/document`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to process document' }));
                throw new Error(errorData.error || 'Failed to process document');
            }

            const data = await response.json();
            onFileProcessed(data.extractedText);
            setIsComplete(true);
        } catch (error) {
            console.error('Document processing error:', error);
            onError(error instanceof Error ? error.message : 'Failed to process document. Please try again.');
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setIsComplete(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getFileIcon = (fileName: string) => {
        if (fileName.endsWith('.pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (fileName.endsWith('.docx')) return <FileType className="w-8 h-8 text-[#8C0000]" />;
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv'))
            return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        return <FileText className="w-8 h-8 text-emerald-600" />;
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
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                <FileText className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900 mb-1">
                                    Drop your document here
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse files
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Upload className="w-4 h-4" />
                                <span>Supports PDF, DOCX, CSV, Excel up to 10MB</span>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-2 border-emerald-200 bg-emerald-50 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                                    ) : isComplete ? (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    ) : (
                                        getFileIcon(file.name)
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {isProcessing
                                            ? 'Processing document...'
                                            : isComplete
                                                ? 'Processing complete!'
                                                : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                    </p>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button
                                    onClick={handleRemove}
                                    className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                        {isComplete && (
                            <p className="mt-3 text-sm text-emerald-700 bg-emerald-100/50 p-2 rounded-lg">
                                Tip: You can edit or refine the extracted information below.
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
