import { Check, Clock, Wrench, Package } from 'lucide-react';
import type { CalculatorTier } from '../types/calculator';
import type { LineItem } from './QuoteSummaryEnhanced';

export interface ServiceDetail {
    name: string;
    description: string;
    deliverables: string[];
    timeline: string;
    technicalSpecs?: string[];
}

interface ServiceBreakdownTableProps {
    selectedTier: CalculatorTier | null;
    selectedAddOns: LineItem[];
}

// Service detail templates - can be customized per service
export const getServiceDetails = (serviceName: string, description?: string): ServiceDetail => {
    // Default template
    return {
        name: serviceName,
        description: description || 'Professional service implementation',
        deliverables: [
            'Initial setup and configuration',
            'Documentation and training materials',
            'Quality assurance testing',
            'Ongoing support and maintenance'
        ],
        timeline: '2-4 weeks',
        technicalSpecs: [
            'Cloud-based infrastructure',
            'Industry-standard security protocols',
            'API integration capabilities',
            'Real-time monitoring and analytics'
        ]
    };
};

export function ServiceBreakdownTable({ selectedTier, selectedAddOns }: ServiceBreakdownTableProps) {
    if (!selectedTier && selectedAddOns.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#3b82f6]" />
                    Detailed Service Breakdown
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Technical overview of all included services and deliverables
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Selected Tier Breakdown */}
                {selectedTier && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                                Selected Tier
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">{selectedTier.name}</h4>
                        </div>

                        {selectedTier.description && (
                            <p className="text-gray-700 leading-relaxed">{selectedTier.description}</p>
                        )}

                        {/* Tier Features Table */}
                        {selectedTier.features && selectedTier.features.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Included Service
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {selectedTier.features.map((feature, index) => {
                                            const detail = getServiceDetails(feature);
                                            return (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium text-gray-900">{feature}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-gray-600">{detail.description}</div>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {detail.timeline}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Wrench className="w-3 h-3" />
                                                                Professional setup
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            <Check className="w-3 h-3" />
                                                            Included
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Technical Specifications */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-blue-600" />
                                Technical Specifications
                            </h5>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                                {getServiceDetails(selectedTier.name).technicalSpecs?.map((spec, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>{spec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Additional Services Breakdown */}
                {selectedAddOns.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-200">
                            <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                                Additional Services
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Scope & Deliverables
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                                            Investment
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {selectedAddOns.map((addon) => {
                                        const detail = getServiceDetails(addon.name, addon.description);
                                        return (
                                            <tr key={addon.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-gray-900">{addon.name}</div>
                                                    {addon.quantity > 1 && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Quantity: {addon.quantity}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-gray-600 mb-2">{detail.description}</div>
                                                    <div className="space-y-1">
                                                        {detail.deliverables.slice(0, 3).map((deliverable, index) => (
                                                            <div key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                                                <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <span>{deliverable}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        Timeline: {detail.timeline}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="font-bold text-gray-900">
                                                        ${addon.total.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {addon.priceType === 'monthly' ? 'per month' : 'one-time'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Summary Note */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        <strong className="text-gray-900">Note:</strong> All services include professional setup, documentation, training materials, and ongoing support. Timeline estimates are based on standard implementation and may vary based on specific requirements.
                    </p>
                </div>
            </div>
        </div>
    );
}
