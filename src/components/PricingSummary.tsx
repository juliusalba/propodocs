
import type { Proposal } from '../types';
import { marineTiers } from '../data/marinePricingData';

export function PricingSummary({ proposal }: { proposal: Proposal | any }) {
    if (!proposal?.calculator_data) return null;

    const data = proposal.calculator_data;
    const type = proposal.calculator_type;

    if (type === 'marine') {
        const tierKey = data.selectedTier as keyof typeof marineTiers | null;
        const tier = tierKey ? marineTiers[tierKey] : null;
        const addOns = data.addOns || {};
        
        // Calculate totals
        let monthlyTotal = 0;
        let setupTotal = 0;
        let oneTimeTotal = 0;

        if (tier) {
            monthlyTotal += tier.monthly;
            setupTotal += tier.setup;
        }
        
        // Add-on logic (simplified for display)
        if (addOns.aiChat) monthlyTotal += 400;
        if (addOns.dmFunnels) monthlyTotal += 400;
        if (addOns.bdcLite) monthlyTotal += 1500;
        if (addOns.creativeBoost) monthlyTotal += 750;
        if (addOns.inventoryFeedMgmt) { setupTotal += 1500; monthlyTotal += 750; }
        if (addOns.localSeoBasic) monthlyTotal += 399;
        if (addOns.localSeoPro) monthlyTotal += 799;
        if (addOns.reputationMgmt) monthlyTotal += 750;
        if (addOns.spanishCreative) monthlyTotal += 500;
        if (addOns.topUps > 0) monthlyTotal += addOns.topUps * 3000;
        if (addOns.emailSms >= 4) monthlyTotal += 1500;
        
        // One-time
        if (addOns.croWebSprint > 0) oneTimeTotal += addOns.croWebSprint * 3500;
        if (addOns.showBurst > 0) oneTimeTotal += addOns.showBurst * 2000;
        if (addOns.onsiteProduction > 0) oneTimeTotal += addOns.onsiteProduction * 2500;
        if (addOns.emailSms > 0 && addOns.emailSms < 4) oneTimeTotal += addOns.emailSms * 600;

        return (
            <div className="my-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Investment Summary</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                        {tier?.name || 'Custom'} Plan
                    </span>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {tier && (
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <div className="font-semibold text-gray-900">{tier.name} Package</div>
                                    <div className="text-sm text-gray-500">{tier.description}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">${tier.monthly.toLocaleString()}/mo</div>
                                    <div className="text-xs text-gray-500">+${tier.setup.toLocaleString()} setup</div>
                                </div>
                            </div>
                        )}
                        
                        {/* Add-ons Summary */}
                        {(Object.keys(addOns).some(k => addOns[k]) && (
                             <div className="pt-2">
                                <div className="text-sm font-medium text-gray-700 mb-2">Selected Add-ons</div>
                                <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {addOns.aiChat && <div>• AI Chat Agent</div>}
                                    {addOns.dmFunnels && <div>• DM Funnels</div>}
                                    {addOns.bdcLite && <div>• BDC Lite</div>}
                                    {addOns.creativeBoost && <div>• Creative Boost</div>}
                                    {addOns.inventoryFeedMgmt && <div>• Inventory Feed Mgmt</div>}
                                    {addOns.reputationMgmt && <div>• Reputation Mgmt</div>}
                                    {addOns.topUps > 0 && <div>• {addOns.topUps}x Top Ups</div>}
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 mt-4 border-t border-gray-200 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Monthly Recurring</span>
                                <span className="font-bold text-gray-900">${monthlyTotal.toLocaleString()}</span>
                            </div>
                            {(setupTotal > 0 || oneTimeTotal > 0) && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">One-time / Setup</span>
                                    <span className="font-medium text-gray-700">${(setupTotal + oneTimeTotal).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // VMG Marketing Logic
    if (type === 'vmg') {
        const totals = data.totals || { monthlyTotal: 0, setupTotal: 0 };
        const services = data.selectedServices || {};
        
        return (
            <div className="my-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Investment Summary</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        VMG Marketing
                    </span>
                </div>
                <div className="p-6">
                    <div className="space-y-3 mb-4">
                         {services.traffic && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Traffic Driver (Tier {services.traffic})</span>
                                <span className="text-gray-900">Included</span>
                            </div>
                        )}
                        {services.retention && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Retention & CRM (Tier {services.retention})</span>
                                <span className="text-gray-900">Included</span>
                            </div>
                        )}
                         {services.creative && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Creative Support (Tier {services.creative})</span>
                                <span className="text-gray-900">Included</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Monthly Total</span>
                            <span className="font-bold text-xl text-gray-900">${totals.monthlyTotal?.toLocaleString()}</span>
                        </div>
                         {totals.setupTotal > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Setup Fee</span>
                                <span className="font-medium text-gray-700">${totals.setupTotal?.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
