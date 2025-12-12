import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { UnsplashPicker } from './UnsplashPicker';
import { isUnsplashConfigured } from '../lib/unsplash';

interface CoverPhotoUploadProps {
    currentPhotoUrl?: string | null;
    onPhotoChange: (url: string | null) => void;
}

type TabMode = 'upload' | 'unsplash';

export function CoverPhotoUpload({ currentPhotoUrl, onPhotoChange }: CoverPhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState<TabMode>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const unsplashEnabled = isUnsplashConfigured();

    const handleFile = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.uploadFile(formData);
            onPhotoChange(response.url);
            toast.success('Cover photo uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload cover photo:', error);
            toast.error('Failed to upload cover photo');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        onPhotoChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUnsplashSelect = (url: string) => {
        onPhotoChange(url);
    };

    if (currentPhotoUrl) {
        return (
            <div className="relative group">
                <div className="relative h-48 sm:h-56 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-100">
                    <img
                        src={currentPhotoUrl}
                        alt="Proposal cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <button
                            onClick={handleRemove}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 text-sm sm:text-base"
                        >
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">Remove Cover Photo</span>
                            <span className="sm:hidden">Remove</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-2 border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden">
            {/* Tab Switcher */}
            {unsplashEnabled && (
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'upload'
                                ? 'bg-white text-[#8C0000] border-b-2 border-[#8C0000]'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Upload</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('unsplash')}
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'unsplash'
                                ? 'bg-white text-[#8C0000] border-b-2 border-[#8C0000]'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Unsplash</span>
                    </button>
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'upload' ? (
                <div
                    className={`p-4 sm:p-6 md:p-8 transition-all ${dragActive ? 'bg-blue-50' : 'bg-gray-50/50'
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center text-center">
                        <div
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${dragActive ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                        >
                            {uploading ? (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ImageIcon
                                    className={`w-6 h-6 sm:w-8 sm:h-8 ${dragActive ? 'text-blue-600' : 'text-gray-400'
                                        }`}
                                />
                            )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                            {uploading ? 'Uploading...' : 'Add Cover Photo'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 px-4">
                            Drag and drop an image, or click to browse
                        </p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                            Choose File
                        </button>

                        <p className="text-xs text-gray-400 mt-2 sm:mt-3">PNG, JPG up to 5MB</p>
                    </div>
                </div>
            ) : (
                <div className="h-[400px] sm:h-[500px]">
                    <UnsplashPicker onSelect={handleUnsplashSelect} />
                </div>
            )}
        </div>
    );
}
