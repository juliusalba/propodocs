import { useState } from 'react';
import { ChevronDown, ChevronUp, FileCheck, XCircle, CheckCircle } from 'lucide-react';

interface ScopeSectionProps {
    proposal: any;
}

export function ScopeSection({ proposal }: ScopeSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!proposal?.calculator_data) return null;

    const data = proposal.calculator_data;
    const isMarketing = proposal.calculator_type === 'marketing';

    const renderMarketingScope = () => {
        const inclusions: string[] = [
            'Strategic planning and campaign development',
            'Regular performance monitoring and optimization',
            'Monthly reporting and analytics',
            'Dedicated account management',
            'Access to proprietary marketing tools and platforms'
        ];

        const exclusions: string[] = [
            'Third-party advertising costs (ad spend)',
            'Stock photography or premium assets (unless specified)',
            'Website development or major technical changes',
            'Print or traditional media advertising',
            'Services outside selected tiers and add-ons'
        ];

        // Add tier-specific inclusions
        if (data.selectedServices?.traffic) {
            inclusions.push('Multi-platform advertising campaign management');
            inclusions.push('Audience research and targeting strategy');
        }

        if (data.selectedServices?.creative) {
            inclusions.push('Custom creative asset production');
            inclusions.push('Brand guidelines adherence');
        }

        if (data.selectedServices?.retention) {
            inclusions.push('Email marketing automation setup');
            inclusions.push('Customer segmentation and lifecycle marketing');
        }

        return { inclusions, exclusions };
    };

    const renderCustomScope = () => {
        const inclusions: string[] = [
            'Selected services and deliverables',
            'Regular progress updates and communication',
            'Performance tracking and reporting',
            'Dedicated project management',
            'Quality assurance and revisions'
        ];

        const exclusions: string[] = [
            'Third-party costs and fees',
            'Additional services not specified',
            'Rush fees for expedited timelines',
            'Out-of-scope requests',
            'Third-party tool subscriptions'
        ];

        return { inclusions, exclusions };
    };

    const { inclusions, exclusions } = isMarketing ? renderMarketingScope() : renderCustomScope();

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <FileCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">Scope of Work</h3>
                        <p className="text-sm text-gray-500">What's included and excluded</p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inclusions */}
                    <div className="bg-green-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Included in Scope
                        </h4>
                        <ul className="space-y-2.5">
                            {inclusions.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 flex-shrink-0 mt-2" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Exclusions */}
                    <div className="bg-red-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Not Included
                        </h4>
                        <ul className="space-y-2.5">
                            {exclusions.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0 mt-2" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
