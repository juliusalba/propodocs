import { useMemo } from 'react';
import { EditableWrapper } from '../editor/EditableWrapper';
import { useEditorOptional } from '../../contexts/EditorContext';
import type { CalculatorSchema, CalculatorTier, CalculatorAddOn } from '../../types/calculator';
import { Check, Plus, MessageSquare, Mail, Palette, MapPin, Calendar } from 'lucide-react';

interface EditableDynamicCalculatorProps {
    schema: CalculatorSchema;
    onSchemaUpdate: (schema: CalculatorSchema) => void;
}

// Category icons mapping
const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('conversational') || lower.includes('chat') || lower.includes('capture')) {
        return <MessageSquare className="w-4 h-4" />;
    }
    if (lower.includes('email') || lower.includes('sms') || lower.includes('enablement')) {
        return <Mail className="w-4 h-4" />;
    }
    if (lower.includes('creative') || lower.includes('cro') || lower.includes('inventory')) {
        return <Palette className="w-4 h-4" />;
    }
    if (lower.includes('local') || lower.includes('reputation') || lower.includes('seo')) {
        return <MapPin className="w-4 h-4" />;
    }
    if (lower.includes('event') || lower.includes('production')) {
        return <Calendar className="w-4 h-4" />;
    }
    return <Plus className="w-4 h-4" />;
};

export function EditableDynamicCalculator({ schema, onSchemaUpdate }: EditableDynamicCalculatorProps) {
    const editor = useEditorOptional();
    const isEditMode = editor?.isEditMode ?? false;

    const layoutType = schema.layout || 'itemized';
    const hasTiers = layoutType === 'tiered' || layoutType === 'hybrid';

    // Group add-ons by category
    const addOnsByCategory = useMemo(() => {
        if (!schema.addOns) return {};
        return schema.addOns.reduce((acc, addon) => {
            const category = addon.category || 'Other Services';
            if (!acc[category]) acc[category] = [];
            acc[category].push(addon);
            return acc;
        }, {} as Record<string, CalculatorAddOn[]>);
    }, [schema.addOns]);

    const handleDeleteTier = (tierId: string) => {
        if (!schema.tiers) return;
        onSchemaUpdate({
            ...schema,
            tiers: schema.tiers.filter(t => t.id !== tierId)
        });
    };

    const handleDeleteAddon = (addonId: string) => {
        if (!schema.addOns) return;
        onSchemaUpdate({
            ...schema,
            addOns: schema.addOns.filter(a => a.id !== addonId)
        });
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
        }
        return `$${value}`;
    };

    return (
        <div className="p-6 space-y-8">
            {/* Tiers Section */}
            {hasTiers && schema.tiers && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        Select Your Tier
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {schema.tiers.map((tier) => (
                            <EditableWrapper
                                key={tier.id}
                                blockType="tier"
                                blockId={tier.id}
                                blockData={tier}
                                onDelete={() => handleDeleteTier(tier.id)}
                            >
                                <TierCard
                                    tier={tier}
                                    isEditMode={isEditMode}
                                    formatCurrency={formatCurrency}
                                />
                            </EditableWrapper>
                        ))}
                    </div>
                </div>
            )}

            {/* Add-ons Section */}
            {schema.addOns && schema.addOns.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">⚡</span>
                        Add-On Services
                    </h3>
                    {Object.entries(addOnsByCategory).map(([category, addons]) => (
                        <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                {getCategoryIcon(category)}
                                <span>{category}</span>
                            </div>
                            <div className="space-y-2">
                                {addons.map((addon) => (
                                    <EditableWrapper
                                        key={addon.id}
                                        blockType="addon"
                                        blockId={addon.id}
                                        blockData={addon}
                                        onDelete={() => handleDeleteAddon(addon.id)}
                                    >
                                        <AddOnCard
                                            addon={addon}
                                            isEditMode={isEditMode}
                                            formatCurrency={formatCurrency}
                                        />
                                    </EditableWrapper>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {(!schema.tiers || schema.tiers.length === 0) && (!schema.addOns || schema.addOns.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    <p>No tiers or add-ons defined yet.</p>
                    <p className="text-sm mt-1">Use AI to generate a calculator schema.</p>
                </div>
            )}
        </div>
    );
}

// Tier Card Component
function TierCard({
    tier,
    isEditMode,
    formatCurrency
}: {
    tier: CalculatorTier;
    isEditMode: boolean;
    formatCurrency: (value: number) => string;
}) {
    return (
        <div className={`bg-white border-2 border-gray-200 rounded-xl p-5 transition-all ${isEditMode ? 'hover:shadow-md' : 'hover:border-[#8C0000] cursor-pointer'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-gray-900 text-lg">{tier.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{tier.description}</p>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-2xl font-bold text-[#8C0000]">
                    {formatCurrency(tier.monthlyPrice)}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                </div>
                {tier.setupFee > 0 && (
                    <div className="text-xs text-gray-500">
                        +{formatCurrency(tier.setupFee)} setup
                    </div>
                )}
            </div>

            {tier.features && tier.features.length > 0 && (
                <div className="space-y-1.5">
                    {tier.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feature}</span>
                        </div>
                    ))}
                    {tier.features.length > 4 && (
                        <div className="text-xs text-gray-400 ml-6">
                            +{tier.features.length - 4} more features
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Add-On Card Component
function AddOnCard({
    addon,
    isEditMode,
    formatCurrency
}: {
    addon: CalculatorAddOn;
    isEditMode: boolean;
    formatCurrency: (value: number) => string;
}) {
    return (
        <div className={`flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl transition-all ${isEditMode ? 'hover:bg-gray-100' : 'hover:border-gray-300'
            }`}>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{addon.name}</div>
                <div className="text-sm text-gray-500 line-clamp-1">{addon.description}</div>
            </div>
            <div className="text-right shrink-0 ml-4">
                <div className="font-semibold text-gray-900">
                    {formatCurrency(addon.price)}
                    <span className="text-xs font-normal text-gray-500">
                        {addon.priceType === 'monthly' ? '/mo' : addon.priceType === 'per-unit' ? '/ea' : ''}
                    </span>
                </div>
                <div className="text-xs text-gray-500 capitalize">{addon.priceType}</div>
            </div>
            {!isEditMode && (
                <button className="ml-3 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    Add
                </button>
            )}
        </div>
    );
}
