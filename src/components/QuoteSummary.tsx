import { DollarSign, FileDown, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuoteSummaryProps {
    monthlyTotal: number;
    setupTotal: number;
    annualTotal: number;
    margin: number;
    onExportPDF?: () => void;
    action?: React.ReactNode;
}

export function QuoteSummary({ monthlyTotal, setupTotal, annualTotal, margin, onExportPDF, action }: QuoteSummaryProps) {
    const isMarginGood = margin >= 60;

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                    <DollarSign className="w-5 h-5 text-white" />
                </div>
                Quote Summary
            </h2>

            <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                    <span className="text-gray-600 font-semibold">Monthly:</span>
                    <span className="text-3xl font-bold" style={{ background: 'linear-gradient(to right, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ${Math.round(monthlyTotal).toLocaleString()}
                    </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b-2 border-gray-100 group/setup relative">
                    <span className="text-gray-600 font-semibold flex items-center gap-1.5">
                        Setup Fee:
                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </span>
                    <span className="text-xl font-bold text-gray-700">${setupTotal.toLocaleString()}</span>
                    <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/setup:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl">
                        50% of first month's retainer (covers onboarding + strategy)
                        <div className="absolute bottom-full left-8 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                    </div>
                </div>

                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl px-4 -mx-2">
                    <span className="text-gray-700 font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Annual Value:
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">
                        ${Math.round(annualTotal).toLocaleString()}
                    </span>
                </div>
            </div>

            {monthlyTotal > 0 && (
                <div className={cn(
                    "mt-5 p-4 rounded-xl border-2 flex flex-col gap-2 transition-all",
                    isMarginGood
                        ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                        : "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
                )}>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold flex items-center gap-2">
                            {isMarginGood ? (
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            Profit Margin:
                        </span>
                        <span className={cn(
                            "text-2xl font-bold",
                            isMarginGood ? "text-emerald-600" : "text-red-600"
                        )}>
                            {margin.toFixed(1)}%
                        </span>
                    </div>
                    {!isMarginGood && (
                        <div className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Below 60% target margin
                        </div>
                    )}
                </div>
            )}

            {/* Action Button */}
            {monthlyTotal > 0 && (
                action ? action : (
                    onExportPDF && (
                        <button
                            onClick={onExportPDF}
                            className="w-full mt-6 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
                            style={{ background: 'linear-gradient(to right, #3b82f6, #1d4ed8)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #3b82f6)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #1d4ed8)'}
                        >
                            <FileDown className="w-5 h-5 group-hover:animate-bounce" />
                            Export as PDF
                        </button>
                    )
                )
            )}
        </div>
    );
}
