import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, CheckCircle } from 'lucide-react';
import { marineTiers } from '../data/marinePricingData';

interface DeliverablesSectionProps {
    proposal: any;
}

export function DeliverablesSection({ proposal }: DeliverablesSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!proposal?.calculator_data) return null;

    const data = proposal.calculator_data;
    const isVMG = proposal.calculator_type === 'vmg';

    const renderVMGDeliverables = () => {
        const deliverables: { title: string; items: string[] }[] = [];

        // Traffic Driver Deliverables
        if (data.selectedServices?.traffic) {
            const tier = data.selectedServices.traffic;
            const tierData = {
                1: {
                    title: 'Traffic Driver - Tier 1',
                    items: [
                        'Up to $10K monthly ad spend management',
                        'Facebook & Instagram advertising',
                        'Basic campaign setup and optimization',
                        'Monthly performance reports',
                        'Email support'
                    ]
                },
                2: {
                    title: 'Traffic Driver - Tier 2',
                    items: [
                        'Up to $25K monthly ad spend management',
                        'Multi-platform advertising (Facebook, Instagram, Google)',
                        'Advanced targeting and audience segmentation',
                        'A/B testing and creative optimization',
                        'Bi-weekly performance reports',
                        'Priority email and phone support'
                    ]
                },
                3: {
                    title: 'Traffic Driver - Tier 3',
                    items: [
                        'Up to $50K monthly ad spend management',
                        'Enterprise-level multi-channel campaigns',
                        'TikTok, LinkedIn, and emerging platform integration',
                        'Advanced attribution modeling',
                        'Custom dashboard and real-time reporting',
                        'Weekly strategy calls',
                        'Dedicated account manager'
                    ]
                }
            };
            deliverables.push(tierData[tier as 1 | 2 | 3]);
        }

        // Creative Support Deliverables
        if (data.selectedServices?.creative) {
            const tier = data.selectedServices.creative;
            const tierData = {
                1: {
                    title: 'Creative Support - Tier 1',
                    items: [
                        '5-10 creatives per month',
                        'Static images and basic graphics',
                        '5-day turnaround time',
                        'Standard brand pack',
                        '2 revision rounds per creative'
                    ]
                },
                2: {
                    title: 'Creative Support - Tier 2',
                    items: [
                        '15-20 creatives per month',
                        'Video content (up to 30 seconds)',
                        '3-day turnaround time',
                        'Premium brand pack with guidelines',
                        'Unlimited revisions',
                        'Motion graphics and animations'
                    ]
                },
                3: {
                    title: 'Creative Support - Tier 3',
                    items: [
                        '30+ creatives per month',
                        'Long-form video production',
                        'Same-day turnaround available',
                        'Comprehensive brand strategy',
                        'Dedicated creative team',
                        'Advanced motion graphics and 3D elements',
                        'Photography and videography services'
                    ]
                }
            };
            deliverables.push(tierData[tier as 1 | 2 | 3]);
        }

        // Retention & CRM Deliverables
        if (data.selectedServices?.retention) {
            const tier = data.selectedServices.retention;
            const tierData = {
                1: {
                    title: 'Retention & CRM - Tier 1',
                    items: [
                        'Basic email campaign setup',
                        'Welcome series automation',
                        'Monthly newsletter',
                        'Basic segmentation',
                        'Performance tracking'
                    ]
                },
                2: {
                    title: 'Retention & CRM - Tier 2',
                    items: [
                        'Full lifecycle automation',
                        'Advanced segmentation and personalization',
                        'A/B testing for email campaigns',
                        'SMS marketing integration',
                        'Cart abandonment flows',
                        'Customer win-back campaigns'
                    ]
                },
                3: {
                    title: 'Retention & CRM - Tier 3',
                    items: [
                        'Enterprise CRM implementation',
                        'Predictive analytics and AI-powered recommendations',
                        'Omnichannel marketing automation',
                        'Custom integration with existing systems',
                        'Advanced reporting and attribution',
                        'Dedicated retention strategist'
                    ]
                }
            };
            deliverables.push(tierData[tier as 1 | 2 | 3]);
        }

        // Add-ons
        if (data.addOns) {
            const addOnItems: string[] = [];
            if (data.addOns.landingPages > 0) {
                addOnItems.push(`${data.addOns.landingPages} Custom Landing Page(s) - High-converting design with A/B testing`);
            }
            if (data.addOns.funnels > 0) {
                addOnItems.push(`${data.addOns.funnels} Sales Funnel(s) - Complete funnel strategy and implementation`);
            }
            if (data.addOns.analytics) {
                addOnItems.push('Advanced Analytics Dashboard - Real-time insights and custom reporting');
            }
            if (data.addOns.workshop) {
                addOnItems.push('Strategy Workshop - Half-day session with senior strategists');
            }
            if (data.addOns.videoPacks > 0) {
                addOnItems.push(`${data.addOns.videoPacks} Video/Motion Pack(s) - Professional video production`);
            }

            if (addOnItems.length > 0) {
                deliverables.push({
                    title: 'Add-on Services',
                    items: addOnItems
                });
            }
        }

        return deliverables;
    };

    const renderMarineDeliverables = () => {
        const deliverables: { title: string; items: string[] }[] = [];

        if (data.selectedTier) {
            const tier = marineTiers[data.selectedTier as keyof typeof marineTiers];
            if (tier) {
                deliverables.push({
                    title: `${tier.name} Tier`,
                    items: tier.deliverables || [
                        'Social media management and content creation',
                        'Paid advertising campaigns',
                        'Website optimization',
                        'Monthly performance reports',
                        'Dedicated account support'
                    ]
                });
            }
        }

        // Marine Add-ons
        if (data.addOns) {
            const addOnItems: string[] = [];
            if (data.addOns.aiChat) {
                addOnItems.push('AI Chat Integration - 24/7 automated customer support');
            }
            if (data.addOns.dmFunnels) {
                addOnItems.push('DM Funnels - Automated Instagram/Facebook messaging campaigns');
            }
            if (data.addOns.videoProduction) {
                addOnItems.push('Video Production - Professional marine industry video content');
            }

            if (addOnItems.length > 0) {
                deliverables.push({
                    title: 'Add-on Services',
                    items: addOnItems
                });
            }
        }

        return deliverables;
    };

    const deliverables = isVMG ? renderVMGDeliverables() : renderMarineDeliverables();

    if (deliverables.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">What's Included</h3>
                        <p className="text-sm text-gray-500">Detailed deliverables breakdown</p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="p-6 space-y-6">
                    {deliverables.map((section, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                {section.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {section.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="flex items-start gap-3 text-sm text-gray-700">
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
