import { X, Sparkles, Zap, LayoutTemplate, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
    const updates = [
        {
            version: "2.2.0",
            date: "December 6, 2024",
            title: "Workflow & Dashboard Enhancements",
            features: [
                {
                    icon: LayoutTemplate,
                    title: "Templates Library",
                    description: "New templates section with pre-built agency calculators to get you started faster."
                },
                {
                    icon: Calculator,
                    title: "Enhanced Custom Calculator",
                    description: "Improved save workflows and data persistence for custom calculator proposals."
                },
                {
                    icon: Sparkles,
                    title: "Smart Notification System",
                    description: "New changelog availability indicators so you never miss an update."
                }
            ]
        },
        {
            version: "2.1.0",
            date: "December 5, 2024",
            title: "Custom Calculators & Agency Features",
            features: [
                {
                    icon: Calculator,
                    title: "Custom Calculator Builder",
                    description: "Create your own service calculators with custom fields, formulas, and logic. Now supports AI generation!"
                },
                {
                    icon: Zap,
                    title: "Discount Support",
                    description: "Add percentage or fixed amount discounts directly within your custom calculators."
                },
                {
                    icon: LayoutTemplate,
                    title: "Generalized Landing Page",
                    description: "A new, agency-focused landing page that emphasizes customizability and white-labeling."
                }
            ]
        },
        {
            version: "2.0.0",
            date: "December 1, 2024",
            title: "Initial Release",
            features: [
                {
                    icon: Sparkles,
                    title: "VMG & Marine Calculators",
                    description: "Standardized calculators for Marketing and Marine services."
                },
                {
                    icon: LayoutTemplate,
                    title: "Proposal Dashboard",
                    description: "Track all your proposals, views, and conversions in one place."
                }
            ]
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#CD8417]/10 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-[#CD8417]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">What's New</h2>
                                    <p className="text-sm text-gray-500">Latest updates and improvements</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {updates.map((update, index) => (
                                <div key={update.version} className="relative">
                                    {index !== updates.length - 1 && (
                                        <div className="absolute left-[19px] top-10 bottom-[-32px] w-0.5 bg-gray-100" />
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center z-10">
                                            <span className="text-xs font-bold text-gray-600">v{update.version.split('.')[0]}.{update.version.split('.')[1]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">{update.title}</h3>
                                                <span className="text-xs font-medium text-gray-400">{update.date}</span>
                                            </div>

                                            <div className="space-y-3">
                                                {update.features.map((feature, fIndex) => (
                                                    <div key={fIndex} className="bg-gray-50 rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                                                        <div className="flex gap-3">
                                                            <div className="mt-1">
                                                                <feature.icon className="w-4 h-4 text-[#8C0000]" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-900">{feature.title}</h4>
                                                                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                                                                    {feature.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-[#8C0000] text-white text-sm font-bold rounded-lg hover:bg-[#A00000] transition-colors shadow-lg shadow-[#8C0000]/20"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
