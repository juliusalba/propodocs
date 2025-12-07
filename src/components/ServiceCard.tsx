import { Info, Check, Sparkles } from 'lucide-react';
import type { Tier } from '../types';
import { cn } from '../lib/utils';

interface ServiceCardProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    tiers: { [key: number]: Tier };
    selectedTier: number | null;
    onSelect: (tier: number) => void;
}

export function ServiceCard({ title, icon, description, tiers, selectedTier, onSelect }: ServiceCardProps) {
    return (
        <div className="mb-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gradient-to-r from-red-100 to-transparent">
                <div className="p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                    <div className="text-white">{icon}</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help transition-colors" style={{ color: '#3b82f6' }} />
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                        {description}
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((tierNum) => {
                    const tier = tiers[tierNum];
                    const isSelected = selectedTier === tierNum;

                    return (
                        <button
                            key={tierNum}
                            onClick={() => onSelect(isSelected ? 0 : tierNum)}
                            className={cn(
                                "group text-left p-5 rounded-xl border-2 transition-all duration-300 relative overflow-hidden",
                                isSelected
                                    ? "border-[#3b82f6] shadow-lg shadow-red-100 scale-[1.02]"
                                    : "bg-white border-gray-200 hover:border-[#3b82f6] hover:shadow-md hover:-translate-y-0.5"
                            )}
                            style={isSelected ? { background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' } : {}}
                        >
                            {/* Background Gradient on Hover */}
                            {!isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>
                            )}

                            <div className="relative">
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 text-white rounded-full p-1.5 shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-xs font-bold px-2 py-1 rounded-md" style={{ color: '#3b82f6', backgroundColor: '#FEE2E2' }}>
                                        Tier {tierNum}
                                    </div>
                                    {tierNum === 3 && (
                                        <Sparkles className="w-3 h-3 text-yellow-500" />
                                    )}
                                </div>

                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    ${(tier.monthly / 1000).toFixed(1)}K
                                    <span className="text-sm font-normal text-gray-500">/mo</span>
                                </div>

                                <div className="text-xs text-gray-500 mb-3 font-medium group/setup relative">
                                    <div className="flex items-center gap-1">
                                        <span>+${tier.setup.toLocaleString()} setup fee</span>
                                        <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                    </div>
                                    <div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/setup:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl">
                                        50% of first month's retainer (covers onboarding + strategy)
                                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                                    </div>
                                </div>

                                <div className="text-xs font-medium text-emerald-600 border-t border-gray-200 pt-3 mt-3 leading-relaxed">
                                    {tier.description.split('•')[0]}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
