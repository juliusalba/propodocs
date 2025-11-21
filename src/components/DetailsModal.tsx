import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { SelectedServices, AddOnsState } from '../types';
import { services, addOnPrices } from '../data/pricingData';

interface DetailsModalProps {
    selectedServices: SelectedServices;
    addOns: AddOnsState;
}

export function DetailsModal({ selectedServices, addOns }: DetailsModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const hasServices = Object.values(selectedServices).some(val => val !== null);
    const hasAddons = addOns.landingPages > 0 || addOns.funnels > 0 || addOns.dashboard || addOns.workshop || addOns.videoPack > 0;

    if (!hasServices && !hasAddons) return null;

    return (
        <div className="mt-8">
            <div className="text-center mb-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isOpen ? 'Hide deliverables & scope' : 'Show deliverables & scope'}
                </button>
            </div>

            {isOpen && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        📋 What's Included
                    </h2>

                    <div className="space-y-4">
                        {/* Services */}
                        {(Object.entries(selectedServices) as [keyof typeof services, number | null][]).map(([key, tier]) => {
                            if (!tier) return null;
                            const service = services[key];
                            const tierData = service.tiers[tier];

                            return (
                                <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <div className="font-semibold text-gray-900 mb-1">
                                        {service.name} - Tier {tier} (${tierData.monthly.toLocaleString()}/mo)
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                        {tierData.description}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add-ons */}
                        {hasAddons && (
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="font-semibold text-gray-900 mb-2">Add-on Services</div>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                                    {addOns.landingPages > 0 && (
                                        <li>{addOns.landingPages} Landing Pages (${(addOns.landingPages * addOnPrices.landingPages).toLocaleString()})</li>
                                    )}
                                    {addOns.funnels > 0 && (
                                        <li>{addOns.funnels} Sales Funnels (${(addOns.funnels * addOnPrices.funnels).toLocaleString()})</li>
                                    )}
                                    {addOns.dashboard && (
                                        <li>Advanced Analytics Dashboard ($2,000 setup + $500/mo)</li>
                                    )}
                                    {addOns.workshop && (
                                        <li>Strategy Workshop - {addOns.workshop === 'halfDay' ? 'Half-day ($3,500)' : 'Full-day ($6,000)'}</li>
                                    )}
                                    {addOns.videoPack > 0 && (
                                        <li>{addOns.videoPack} Video/Motion Packs (${(addOns.videoPack * addOnPrices.videoPack).toLocaleString()})</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
