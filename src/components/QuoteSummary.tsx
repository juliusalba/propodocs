import { DollarSign, FileDown, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuoteSummaryProps {
    monthlyTotal: number;
    setupTotal: number;
    annualTotal: number;
    margin: number;
    onExportPDF: () => void;
}

export function QuoteSummary({ monthlyTotal, setupTotal, annualTotal, margin, onExportPDF }: QuoteSummaryProps) {
    const isMarginGood = margin >= 60;

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(135deg, #7A1E1E 0%, #501010 100%)' }}>
                    <DollarSign className="w-5 h-5 text-white" />
                </div>
                Quote Summary
            </h2>

            <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                    <span className="text-gray-600 font-semibold">Monthly:</span>
                    <span className="text-3xl font-bold" style={{ background: 'linear-gradient(to right, #7A1E1E, #501010)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ${Math.round(monthlyTotal).toLocaleString()}
                    </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                    <span className="text-gray-600 font-semibold">Setup:</span>
                    <span className="text-xl font-bold text-gray-700">${setupTotal.toLocaleString()}</span>
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

            {/* Export PDF Button */}
            {monthlyTotal > 0 && (
                <button
                    onClick={onExportPDF}
                    className="w-full mt-6 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
                    style={{ background: 'linear-gradient(to right, #7A1E1E, #501010)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #501010, #7A1E1E)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #7A1E1E, #501010)'}
                >
                    <FileDown className="w-5 h-5 group-hover:animate-bounce" />
                    Export as PDF
                </button>
            )}
        </div>
    );
}
