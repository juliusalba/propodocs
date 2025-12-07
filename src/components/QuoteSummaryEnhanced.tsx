import { DollarSign, FileDown, TrendingUp, Info, Check, Sparkles, Save } from 'lucide-react';
import type { CalculatorTier, CalculatorTotals } from '../types/calculator';

export interface LineItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    priceType: 'monthly' | 'one-time' | 'setup';
    total: number;
}

export interface QuoteSummaryEnhancedProps {
    selectedTier: CalculatorTier | null;
    lineItems: LineItem[];
    totals: CalculatorTotals;
    contractTerm: '6' | '12';
    onExportPDF?: () => void;
    onSaveDraft?: () => void;
    onGenerateProposal?: () => void;
    isGenerating?: boolean;
    proposalButton?: React.ReactNode;
}

export function QuoteSummaryEnhanced({
    selectedTier,
    lineItems,
    totals,
    contractTerm,
    onExportPDF,
    onSaveDraft,
    onGenerateProposal,
    isGenerating = false,
    proposalButton
}: QuoteSummaryEnhancedProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(value);
    };

    const monthlyItems = lineItems.filter(item => item.priceType === 'monthly');
    const oneTimeItems = lineItems.filter(item => item.priceType === 'one-time' || item.priceType === 'setup');

    const hasItems = selectedTier || lineItems.length > 0;

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 shadow-lg sticky self-start" style={{ top: 'max(1.5rem, calc(50vh - 300px))' }}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl shadow-md"
                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                    >
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    Quote Summary
                </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Monthly Total - Hero */}
                <div className="text-center py-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Monthly Investment</div>
                    <div
                        className="text-4xl font-bold"
                        style={{
                            background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {formatCurrency(totals.monthlyTotal)}
                    </div>
                    {contractTerm === '12' && totals.monthlyTotal > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3" />
                            5% Annual Discount Applied
                        </div>
                    )}
                </div>

                {/* Line Items */}
                {hasItems && (
                    <div className="space-y-4">
                        {/* Selected Tier */}
                        {selectedTier && (
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                                            Selected Tier
                                        </div>
                                        <div className="font-semibold text-gray-900 truncate">
                                            {selectedTier.name}
                                        </div>
                                        {selectedTier.description && (
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {selectedTier.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-gray-900">
                                            {formatCurrency(selectedTier.monthlyPrice)}
                                            <span className="text-xs font-normal text-gray-500">/mo</span>
                                        </div>
                                        {selectedTier.setupFee > 0 && (
                                            <div className="text-xs text-gray-500">
                                                +{formatCurrency(selectedTier.setupFee)} setup
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Monthly Add-ons */}
                        {monthlyItems.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
                                    Monthly Add-ons
                                </div>
                                <div className="space-y-2">
                                    {monthlyItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-gray-700 truncate block">
                                                    {item.name}
                                                    {item.quantity > 1 && (
                                                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 shrink-0 ml-2">
                                                {formatCurrency(item.total)}/mo
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* One-time Items */}
                        {oneTimeItems.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
                                    One-time Costs
                                </div>
                                <div className="space-y-2">
                                    {oneTimeItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-gray-700 truncate block">
                                                    {item.name}
                                                    {item.quantity > 1 && (
                                                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 shrink-0 ml-2">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Totals */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                            Setup Fee
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl">
                                    Covers onboarding + strategy session
                                </div>
                            </div>
                        </span>
                        <span className="font-semibold text-gray-900">
                            {formatCurrency(totals.setupTotal)}
                        </span>
                    </div>

                    {totals.oneTimeTotal > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">One-time Total</span>
                            <span className="font-semibold text-gray-900">
                                {formatCurrency(totals.oneTimeTotal)}
                            </span>
                        </div>
                    )}

                    {/* Contract Value */}
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl -mx-1">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            {contractTerm === '12' ? 'Annual' : '6-Month'} Value
                        </span>
                        <span className="text-xl font-bold text-emerald-600">
                            {formatCurrency(
                                contractTerm === '12'
                                    ? totals.annualTotal
                                    : totals.monthlyTotal * 6 + totals.setupTotal + totals.oneTimeTotal
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {totals.monthlyTotal > 0 && (
                <div className="p-6 pt-0 space-y-3">
                    {proposalButton || (
                        <button
                            onClick={onGenerateProposal}
                            disabled={isGenerating}
                            className="w-full py-3.5 px-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                        >
                            <Sparkles className="w-4 h-4" />
                            {isGenerating ? 'Generating...' : 'Generate Proposal'}
                        </button>
                    )}

                    <button
                        onClick={onExportPDF}
                        className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <FileDown className="w-4 h-4" />
                        Export as PDF
                    </button>

                    <button
                        onClick={onSaveDraft}
                        className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save as Draft
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!hasItems && (
                <div className="p-6 pt-0 text-center">
                    <p className="text-sm text-gray-500">
                        Select a tier or add-ons to see pricing
                    </p>
                </div>
            )}

            {/* Footer Info */}
            {totals.monthlyTotal > 0 && (
                <div className="mx-6 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-gray-700 leading-relaxed">
                        <strong>{contractTerm === '12' ? '12-month' : '6-month'} term</strong> •{' '}
                        <strong>&lt;5-minute response SLA</strong> •{' '}
                        Setup fee covers onboarding + strategy
                    </p>
                </div>
            )}
        </div>
    );
}
