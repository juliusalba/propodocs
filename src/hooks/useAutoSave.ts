import { useEffect, useRef, useCallback, useState } from 'react';

interface AutoSaveOptions {
    key: string;
    data: any;
    onSave: (data: any) => Promise<void>;
    delay?: number;
    enabled?: boolean;
}

interface AutoSaveStatus {
    status: 'idle' | 'saving' | 'saved' | 'error';
    lastSaved: Date | null;
    error: string | null;
}

export function useAutoSave({
    key,
    data,
    onSave,
    delay = 30000, // 30 seconds
    enabled = true,
}: AutoSaveOptions): AutoSaveStatus {
    const [status, setStatus] = useState<AutoSaveStatus>({
        status: 'idle',
        lastSaved: null,
        error: null,
    });

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previousDataRef = useRef<string | undefined>(undefined);

    const save = useCallback(async () => {
        if (!enabled) return;

        try {
            setStatus(prev => ({ ...prev, status: 'saving', error: null }));

            // Save to localStorage as backup
            localStorage.setItem(`autosave:${key}`, JSON.stringify({
                data,
                timestamp: new Date().toISOString(),
            }));

            // Save to server
            await onSave(data);

            setStatus({
                status: 'saved',
                lastSaved: new Date(),
                error: null,
            });

            // Reset to idle after 2 seconds
            setTimeout(() => {
                setStatus(prev => prev.status === 'saved' ? { ...prev, status: 'idle' } : prev);
            }, 2000);
        } catch (error) {
            console.error('Auto-save failed:', error);
            setStatus({
                status: 'error',
                lastSaved: null,
                error: error instanceof Error ? error.message : 'Failed to save',
            });
        }
    }, [key, data, onSave, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const currentData = JSON.stringify(data);

        // Skip if data hasn't changed
        if (currentData === previousDataRef.current) {
            return;
        }

        previousDataRef.current = currentData;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            save();
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, delay, save, enabled]);

    return status;
}

/**
 * Recover auto-saved data from localStorage
 */
export function recoverAutoSave<T>(key: string): { data: T; timestamp: string } | null {
    try {
        const saved = localStorage.getItem(`autosave:${key}`);
        if (!saved) return null;

        const parsed = JSON.parse(saved);
        return parsed;
    } catch (error) {
        console.error('Failed to recover auto-save:', error);
        return null;
    }
}

/**
 * Clear auto-saved data from localStorage
 */
export function clearAutoSave(key: string): void {
    localStorage.removeItem(`autosave:${key}`);
}
