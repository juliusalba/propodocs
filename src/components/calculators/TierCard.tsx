import React, { useState } from 'react';
import type { CalculatorTier } from '../../types/calculator';
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface TierCardProps {
    tier: CalculatorTier;
    index: number;
    isSelected: boolean;
    isLight: boolean;
    onSelect: () => void;
    formatCurrency: (value: number) => string;
    formatPrice: (value: number) => string;
}

export const TierCard: React.FC<TierCardProps> = ({
    tier,
    index,
    isSelected,
    isLight,
    onSelect,
    formatCurrency,
    formatPrice,
}) => {
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const displayedFeatures = showAllFeatures ? tier.features : tier.features?.slice(0, 2);
    const hasMoreFeatures = (tier.features?.length || 0) > 2;

    const tierEmojis = ['⭐', '🚀', '💎', '🏆', '🎯', '✨'];

    return (
        <div className="relative">
            {/* Checkmark outside container */}
            {isSelected && (
                <div
                    className="absolute -top-2 -right-2 z-20 text-white rounded-full p-1.5 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #8C0000 0%, #500000 100%)' }}
                >
                    <Check className="w-4 h-4" />
                </div>
            )}

            <button
                onClick={onSelect}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${isSelected
                    ? 'border-[#8C0000] shadow-lg scale-[1.02] bg-[#8C0000]/5'
                    : isLight
                        ? 'bg-white border-gray-200 hover:border-[#CD8417] hover:shadow-md hover:-translate-y-0.5'
                        : 'border-white/10 hover:border-[#CD8417]/50 hover:bg-white/5'
                    }`}
            >
                {/* Tier badge with info icon */}
                <div className="mb-3 flex items-center justify-between">
                    <div
                        className="p-2 rounded-lg inline-block"
                        style={{
                            background: isSelected
                                ? 'linear-gradient(135deg, #8C0000 0%, #500000 100%)'
                                : 'linear-gradient(135deg, #CD8417 0%, #FFC917 100%)'
                        }}
                    >
                        <div className="text-white text-sm font-bold">
                            {tierEmojis[index % tierEmojis.length]}
                        </div>
                    </div>

                    {/* Info tooltip trigger */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTooltip(!showTooltip);
                            }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className={`p-1.5 rounded-lg transition-colors ${isLight
                                ? 'text-gray-400 hover:text-[#8C0000] hover:bg-[#8C0000]/5'
                                : 'text-white/40 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Info className="w-4 h-4" />
                        </button>

                        {/* Tooltip */}
                        {showTooltip && (
                            <div
                                className="absolute right-0 top-full mt-2 z-30 w-64 p-4 rounded-xl bg-gray-900 text-white shadow-xl border border-gray-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                    Tier Details
                                </div>
                                <h5 className="font-bold mb-1">{tier.name}</h5>
                                <p className="text-sm text-gray-300 mb-3">{tier.description}</p>

                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700">
                                    <div>
                                        <div className="text-xs text-gray-400">Monthly</div>
                                        <div className="font-bold text-[#CD8417]">{formatCurrency(tier.monthlyPrice)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Setup</div>
                                        <div className="font-bold text-[#8C0000]">{formatPrice(tier.setupFee)}</div>
                                    </div>
                                </div>

                                {tier.features && tier.features.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                        <div className="text-xs text-gray-400 mb-2">All Features ({tier.features.length})</div>
                                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                                            {tier.features.map((feature, idx) => (
                                                <li key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                                                    <span className="text-[#8C0000] mt-0.5">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Arrow pointer */}
                                <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 border-l border-t border-gray-800 rotate-45" />
                            </div>
                        )}
                    </div>
                </div>

                <h4 className={`text-xl font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {tier.name}
                </h4>
                <p className={`text-sm mb-3 line-clamp-2 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                    {tier.description}
                </p>

                <div className={`text-2xl font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-[#8C0000]'}`}>
                    {formatCurrency(tier.monthlyPrice)}
                    <span className={`text-sm font-normal ${isLight ? 'text-gray-500' : 'text-white/40'}`}>/mo</span>
                </div>
                <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                    +{formatPrice(tier.setupFee)} setup
                </p>

                {/* Expandable features */}
                {tier.features && tier.features.length > 0 && (
                    <div className={`text-xs border-t pt-3 mt-3 ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                        <ul className="space-y-1">
                            {displayedFeatures?.map((feature, idx) => (
                                <li key={idx} className={`flex items-start gap-2 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                                    <span className="text-[#8C0000] mt-0.5">✓</span>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        {hasMoreFeatures && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllFeatures(!showAllFeatures);
                                }}
                                className={`mt-2 flex items-center gap-1 text-xs font-medium ${isLight ? 'text-[#8C0000] hover:text-[#A00000]' : 'text-[#8C0000] hover:text-[#A00000]'}`}
                            >
                                {showAllFeatures ? (
                                    <><ChevronUp className="w-3 h-3" /> Show less</>
                                ) : (
                                    <><ChevronDown className="w-3 h-3" /> +{(tier.features?.length || 0) - 2} more</>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
};
