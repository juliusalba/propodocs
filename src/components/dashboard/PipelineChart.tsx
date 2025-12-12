import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

interface PipelineData {
    totalPipelineValue: number;
    breakdown: {
        status: string;
        value: number;
        count: number;
        label: string;
    }[];
}

interface PipelineChartProps {
    data: PipelineData | null;
    loading: boolean;
    timePeriod?: string;
    onPeriodChange?: (period: string) => void;
}

export function PipelineChart({ data, loading, timePeriod = 'all', onPeriodChange }: PipelineChartProps) {
    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!data || data.totalPipelineValue === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium">No pipeline data yet</p>
                <p className="text-gray-500 text-sm mt-1">Create proposals to see your pipeline value</p>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getBarColor = (status: string) => {
        switch (status) {
            case 'draft': return '#9ca3af'; // gray-400
            case 'sent': return '#CD8417'; // Propodocs Gold
            case 'viewed': return '#f59e0b'; // amber-500
            case 'accepted': return '#10b981'; // emerald-500
            case 'rejected': return '#ef4444'; // red-500
            default: return '#6b7280';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Pipeline Value</h3>
                    <p className="text-sm text-gray-500">Total potential revenue by stage</p>
                </div>
                <div className="flex items-center gap-4">
                    {onPeriodChange && (
                        <select
                            value={timePeriod}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8C0000] focus:border-transparent transition-colors"
                        >
                            <option value="all">All Time</option>
                            <option value="month">This Month</option>
                            <option value="ytd">Year to Date</option>
                        </select>
                    )}
                    <div className="text-right">
                        <p className="text-2xl font-bold text-[#8C0000]">
                            {formatCurrency(data.totalPipelineValue)}
                        </p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Value</p>
                    </div>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.breakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3">
                                            <p className="font-medium text-gray-900 mb-1">{data.label}</p>
                                            <p className="text-[#8C0000] font-bold text-lg">
                                                {formatCurrency(data.value)}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {data.count} proposal{data.count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            {data.breakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
