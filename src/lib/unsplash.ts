// Unsplash API integration
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_BASE = 'https://api.unsplash.com';

export interface UnsplashPhoto {
    id: string;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    user: {
        name: string;
        username: string;
        links: {
            html: string;
        };
    };
    links: {
        download_location: string;
    };
    description: string | null;
    alt_description: string | null;
}

export interface UnsplashSearchResponse {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
}

/**
 * Search for photos on Unsplash
 * @param query Search query
 * @param page Page number (default: 1)
 * @param perPage Results per page (default: 12)
 */
export async function searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 12
): Promise<UnsplashSearchResponse> {
    if (!UNSPLASH_ACCESS_KEY) {
        throw new Error('Unsplash API key not configured. Please add VITE_UNSPLASH_ACCESS_KEY to your .env file.');
    }

    const url = new URL(`${UNSPLASH_API_BASE}/search/photos`);
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    url.searchParams.append('client_id', UNSPLASH_ACCESS_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({ errors: ['Unknown error'] }));
        throw new Error(error.errors?.[0] || 'Failed to search photos');
    }

    return response.json();
}

/**
 * Trigger a download event for Unsplash attribution
 * Required by Unsplash API guidelines
 */
export async function triggerDownload(downloadLocation: string): Promise<void> {
    if (!UNSPLASH_ACCESS_KEY) {
        return;
    }

    const url = new URL(downloadLocation);
    url.searchParams.append('client_id', UNSPLASH_ACCESS_KEY);

    await fetch(url.toString()).catch(err => {
        console.warn('Failed to trigger Unsplash download event:', err);
    });
}

/**
 * Check if Unsplash API is configured
 */
export function isUnsplashConfigured(): boolean {
    return !!UNSPLASH_ACCESS_KEY;
}
