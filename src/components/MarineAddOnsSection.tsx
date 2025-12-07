import { marineAddOns } from '../data/marinePricingData';
import type { MarineAddOnsState } from '../types/marine';

interface MarineAddOnsSectionProps {
    addOns: MarineAddOnsState;
    onUpdate: (key: keyof MarineAddOnsState, value: any) => void;
}

export function MarineAddOnsSection({ addOns, onUpdate }: MarineAddOnsSectionProps) {
    const categories = {
        conversational: { title: 'Conversational & Capture', icon: '💬' },
        email: { title: 'Email/SMS & Enablement', icon: '📧' },
        creative: { title: 'Creative/CRO/Inventory', icon: '🎨' },
        local: { title: 'Local & Reputation', icon: '📍' },
        events: { title: 'Events & Production', icon: '🎪' }
    };

    const addOnsByCategory = {
        conversational: ['aiChat', 'dmFunnels'],
        email: ['emailSms', 'bdcLite'],
        creative: ['creativeBoost', 'croWebSprint', 'inventoryFeedMgmt', 'spanishCreative', 'topUps'],
        local: ['localSeoBasic', 'localSeoPro', 'reputationMgmt'],
        events: ['showBurst', 'onsiteProduction']
    };

    const renderAddOn = (key: string) => {
        const addOn = marineAddOns[key];
        if (!addOn) return null;

        const isBoolean = typeof addOns[key as keyof MarineAddOnsState] === 'boolean';
        const isNumber = typeof addOns[key as keyof MarineAddOnsState] === 'number';

        return (
            <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#3b82f6] transition-colors">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{addOn.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{addOn.description}</p>
                        <div className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                            {typeof addOn.price === 'number'
                                ? `$${addOn.price.toLocaleString()}/mo`
                                : addOn.price.setup
                                    ? `$${addOn.price.setup.toLocaleString()} setup + $${addOn.price.monthly?.toLocaleString()}/mo`
                                    : addOn.price.perSend
                                        ? `$${addOn.price.perSend}/send or $${addOn.price.perMonth}/mo`
                                        : `$${addOn.price.monthly?.toLocaleString()}/mo`
                            }
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        {isBoolean && (
                            <button
                                onClick={() => onUpdate(key as keyof MarineAddOnsState, !addOns[key as keyof MarineAddOnsState])}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${addOns[key as keyof MarineAddOnsState]
                                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white shadow-md'
                                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#3b82f6]'
                                    }`}
                            >
                                {addOns[key as keyof MarineAddOnsState] ? 'Added' : 'Add'}
                            </button>
                        )}

                        {isNumber && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const current = addOns[key as keyof MarineAddOnsState] as number;
                                        if (current > 0) onUpdate(key as keyof MarineAddOnsState, current - 1);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 hover:border-[#3b82f6] font-bold text-gray-700 transition-colors"
                                    disabled={(addOns[key as keyof MarineAddOnsState] as number) === 0}
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-bold text-gray-900">
                                    {addOns[key as keyof MarineAddOnsState]}
                                </span>
                                <button
                                    onClick={() => {
                                        const current = addOns[key as keyof MarineAddOnsState] as number;
                                        onUpdate(key as keyof MarineAddOnsState, current + 1);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-bold hover:shadow-md transition-all"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Add-On Services
            </h2>

            <div className="space-y-6">
                {Object.entries(categories).map(([categoryKey, categoryInfo]) => (
                    <div key={categoryKey}>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span>{categoryInfo.icon}</span>
                            {categoryInfo.title}
                        </h3>
                        <div className="space-y-3">
                            {addOnsByCategory[categoryKey as keyof typeof addOnsByCategory].map(renderAddOn)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
