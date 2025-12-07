import { Check, AlertCircle, Loader2, Clock } from 'lucide-react';

interface SaveStatusProps {
    status: 'idle' | 'saving' | 'saved' | 'error';
    lastSaved: Date | null;
    error: string | null;
}

export function SaveStatus({ status, lastSaved, error }: SaveStatusProps) {
    const getStatusDisplay = () => {
        switch (status) {
            case 'saving':
                return (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Saving...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Saved</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{error || 'Failed to save'}</span>
                    </div>
                );
            case 'idle':
            default:
                if (lastSaved) {
                    const timeAgo = getTimeAgo(lastSaved);
                    return (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Saved {timeAgo}</span>
                        </div>
                    );
                }
                return null;
        }
    };

    return (
        <div className="flex items-center justify-end min-w-[120px]">
            {getStatusDisplay()}
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
