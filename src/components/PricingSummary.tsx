
import type { Proposal } from '../types';

export function PricingSummary({ proposal }: { proposal: Proposal | any }) {
    if (!proposal?.calculator_data) return null;

    const data = proposal.calculator_data;
    const type = proposal.calculator_type;

    // Marketing calculator logic
    if (type === 'marketing') {
        const totals = data.totals || { monthlyTotal: 0, setupTotal: 0 };
        const services = data.selectedServices || {};

        return (
            <div className="my-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Investment Summary</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Marketing
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

    // Custom calculator logic
    if (type === 'custom') {
        const totals = data.totals || { monthlyTotal: 0, setupTotal: 0, oneTimeTotal: 0 };

        return (
            <div className="my-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Investment Summary</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Custom
                    </span>
                </div>
                <div className="p-6">
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
                        {totals.oneTimeTotal > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">One-time</span>
                                <span className="font-medium text-gray-700">${totals.oneTimeTotal?.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
