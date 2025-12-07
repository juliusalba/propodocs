import { useState } from 'react';
import {
    Calculator,
    Lightbulb,
    Target,
    DollarSign,
    Users,
    ChevronRight,
    ChevronDown,
    Sparkles,
    FileText,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalculatorGuideProps {
    onCreateNew?: () => void;
}

export function CalculatorGuide({ onCreateNew }: CalculatorGuideProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('what');

    const sections = [
        {
            id: 'what',
            title: 'What is a Calculator?',
            icon: Calculator,
            content: (
                <div className="space-y-3 text-gray-600">
                    <p>
                        A <strong>pricing calculator</strong> is an interactive tool that helps you
                        present your services and pricing to clients in a clear, professional way.
                    </p>
                    <p>
                        Instead of sending static price lists, calculators let clients:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Select service tiers that fit their needs</li>
                        <li>Add optional services (add-ons)</li>
                        <li>See real-time pricing updates</li>
                        <li>Understand exactly what they're paying for</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'why',
            title: 'Why Use Calculators?',
            icon: Target,
            content: (
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Increase Conversions</h4>
                            <p className="text-sm text-gray-600">
                                Transparent pricing builds trust. Clients can see value before committing.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Save Time</h4>
                            <p className="text-sm text-gray-600">
                                Stop creating custom quotes for every lead. Let the calculator do the work.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Seamless Proposals</h4>
                            <p className="text-sm text-gray-600">
                                Calculator selections flow directly into proposals, contracts, and invoices.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'how',
            title: 'How to Create a Calculator',
            icon: Sparkles,
            content: (
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            1
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Describe Your Services</h4>
                            <p className="text-sm text-gray-600">
                                Tell our AI what services you offer. Include pricing tiers, add-ons, and features.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            2
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Review & Customize</h4>
                            <p className="text-sm text-gray-600">
                                AI generates a calculator. Edit tiers, prices, and features as needed.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            3
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Use with Clients</h4>
                            <p className="text-sm text-gray-600">
                                Open the calculator, fill in client details, and generate proposals instantly.
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Getting Started with Calculators</h2>
                </div>
                <p className="text-white/80 text-sm">
                    Learn how pricing calculators can streamline your sales process.
                </p>
            </div>

            {/* Accordion Sections */}
            <div className="divide-y divide-gray-100">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSection === section.id;

                    return (
                        <div key={section.id}>
                            <button
                                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-gray-900">{section.title}</span>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-5 pt-2">
                                            {section.content}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            {onCreateNew && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onCreateNew}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Sparkles className="w-5 h-5" />
                        Create Your First Calculator
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
