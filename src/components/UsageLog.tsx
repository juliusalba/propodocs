import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function UsageLog() {
    const [lastUsed, setLastUsed] = useState<string | null>(null);
    const [usageCount, setUsageCount] = useState<number>(0);

    useEffect(() => {
        // Get last used timestamp
        const lastUsedTimestamp = localStorage.getItem('vmg-calculator-last-used');
        const count = parseInt(localStorage.getItem('vmg-calculator-usage-count') || '0', 10);

        if (lastUsedTimestamp) {
            setLastUsed(lastUsedTimestamp);
        }

        setUsageCount(count);

        // Update current usage
        const now = new Date().toISOString();
        localStorage.setItem('vmg-calculator-last-used', now);
        localStorage.setItem('vmg-calculator-usage-count', String(count + 1));
    }, []);

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!lastUsed) return null;

    return (
        <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                    <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-700">Last Used</div>
                    <div className="text-xs text-gray-500">{formatDate(lastUsed)}</div>
                </div>
                {usageCount > 1 && (
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Total Uses</div>
                        <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>{usageCount}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
