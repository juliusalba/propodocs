import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { searchPhotos, triggerDownload, type UnsplashPhoto } from '../lib/unsplash';
import { useToast } from './Toast';

interface UnsplashPickerProps {
    onSelect: (url: string) => void;
}

export function UnsplashPicker({ onSelect }: UnsplashPickerProps) {
    const [query, setQuery] = useState('business proposal');
    const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
    const toast = useToast();

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const response = await searchPhotos(searchQuery);
            setPhotos(response.results);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search photos';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Initial search on mount
    useEffect(() => {
        handleSearch(query);
    }, []);

    const handlePhotoSelect = async (photo: UnsplashPhoto) => {
        setSelectedPhoto(photo);

        // Trigger download event for Unsplash attribution
        try {
            await triggerDownload(photo.links.download_location);
        } catch (err) {
            console.warn('Failed to trigger download event:', err);
        }

        // Use the regular size for cover photos
        onSelect(photo.urls.regular);
        toast.success('Cover photo selected!');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search for images..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    />
                    <button
                        onClick={() => handleSearch(query)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#3b82f6] text-white text-sm rounded-md hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No photos found. Try a different search term.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => handlePhotoSelect(photo)}
                                className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedPhoto?.id === photo.id
                                        ? 'border-[#3b82f6] ring-2 ring-[#3b82f6] ring-offset-2'
                                        : 'border-transparent hover:border-gray-300'
                                    }`}
                            >
                                <img
                                    src={photo.urls.small}
                                    alt={photo.alt_description || photo.description || 'Unsplash photo'}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                                {/* Photographer attribution on hover */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white truncate">
                                        by {photo.user.name}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Attribution Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-600 text-center">
                    Photos from{' '}
                    <a
                        href="https://unsplash.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b82f6] hover:underline inline-flex items-center gap-1"
                    >
                        Unsplash
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </p>
            </div>
        </div>
    );
}
