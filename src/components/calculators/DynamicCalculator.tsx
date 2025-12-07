import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CalculatorSchema, CalculatorRow, CalculatorTier, CalculatorTotals } from '../../types/calculator';
import { Plus, Trash2, Minus, MessageSquare, Mail, Palette, MapPin, Calendar } from 'lucide-react';
import { nanoid } from 'nanoid';
import { TierCard } from './TierCard';

export interface DynamicCalculatorProps {
    schema: CalculatorSchema;
    initialData?: CalculatorRow[];
    // Controlled state props
    selectedTier?: CalculatorTier | null;
    onSelectTier?: (tier: CalculatorTier | null) => void;
    addOnStates?: Record<string, boolean | number>;
    onAddOnChange?: (states: Record<string, boolean | number>) => void;
    // Data change callback
    onChange?: (data: CalculatorRow[], totals: CalculatorTotals) => void;
    // Theme
    theme?: 'light' | 'dark' | 'brand';
    // Full page mode
    isFullPage?: boolean;
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

export const DynamicCalculator: React.FC<DynamicCalculatorProps> = ({
    schema,
    initialData = [],
    selectedTier: controlledTier,
    onSelectTier,
    addOnStates: controlledAddOns,
    onAddOnChange,
    onChange,
    theme = 'light'
}) => {
    // State for itemized rows (always internal for now, but initialized)
    const [rows, setRows] = useState<CalculatorRow[]>(initialData.length > 0 ? initialData : [{ id: nanoid() }]);
    const [discount] = useState<number>(0);
    const [discountType] = useState<'percent' | 'fixed'>('percent');

    // Internal state if not controlled
    const [internalTier, setInternalTier] = useState<CalculatorTier | null>(null);
    const [internalAddOnlyStates, setInternalAddOns] = useState<Record<string, boolean | number>>({});

    // UI State
    const [showDetails, setShowDetails] = useState<boolean>(schema.layout === 'itemized');

    // Use controlled or internal state
    const selectedTier = controlledTier !== undefined ? controlledTier : internalTier;
    const handleSetTier = (tier: CalculatorTier | null) => {
        if (onSelectTier) onSelectTier(tier);
        else setInternalTier(tier);
    };

    const addOnStates = controlledAddOns !== undefined ? controlledAddOns : internalAddOnlyStates;
    const handleSetAddOns = (states: Record<string, boolean | number> | ((prev: Record<string, boolean | number>) => Record<string, boolean | number>)) => {
        if (onAddOnChange) {
            // If function is passed, we need the current value to compute next
            const next = typeof states === 'function' ? states(addOnStates) : states;
            onAddOnChange(next);
        } else {
            setInternalAddOns(states);
        }
    };

    // Determine layout type
    const layoutType = schema.layout || 'itemized';
    const hasTiers = layoutType === 'tiered' || layoutType === 'hybrid';
    const hasItemized = layoutType === 'itemized' || layoutType === 'hybrid';

    // Define calculateFormula BEFORE useMemo that uses it
    const calculateFormula = useCallback((formula: string, row: CalculatorRow) => {
        try {
            let expression = formula;
            schema.columns?.forEach(col => {
                const val = parseFloat(row[col.id]) || 0;
                expression = expression.replace(new RegExp(`\\b${col.id}\\b`, 'g'), val.toString());
            });

            if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(expression)) {
                return 0;
            }

            return new Function(`return ${expression}`)();
        } catch (e) {
            return 0;
        }
    }, [schema.columns]);

    // Calculate totals based on layout type
    const totals = useMemo((): CalculatorTotals => {
        let monthlyTotal = 0;
        let setupTotal = 0;
        let oneTimeTotal = 0;

        // Tier pricing
        if (selectedTier) {
            monthlyTotal += Number(selectedTier.monthlyPrice) || 0;
            setupTotal += Number(selectedTier.setupFee) || 0;
        }

        // Add-ons
        if (schema.addOns) {
            schema.addOns.forEach(addon => {
                const state = addOnStates[addon.id];
                if (state) {
                    const quantity = typeof state === 'number' ? state : 1;
                    if (addon.priceType === 'monthly') {
                        monthlyTotal += addon.price * quantity;
                    } else if (addon.priceType === 'one-time') {
                        oneTimeTotal += addon.price * quantity;
                    } else {
                        oneTimeTotal += addon.price * quantity;
                    }
                }
            });
        }

        // Itemized rows
        if (hasItemized && schema.columns) {
            const formulaColumns = schema.columns.filter(col => col.type === 'formula');
            rows.forEach(row => {
                formulaColumns.forEach(col => {
                    const val = calculateFormula(col.formula || '0', row);
                    if (typeof val === 'number') {
                        monthlyTotal += val;
                    }
                });
            });
        }

        // Apply discount
        const discountAmount = discountType === 'percent' ? monthlyTotal * (discount / 100) : discount;
        monthlyTotal = Math.max(0, monthlyTotal - discountAmount);

        const annualTotal = monthlyTotal * 12 + setupTotal + oneTimeTotal;

        return { monthlyTotal, setupTotal, oneTimeTotal, annualTotal };
    }, [selectedTier, addOnStates, rows, discount, discountType, schema.addOns, schema.columns, hasItemized, calculateFormula]);

    useEffect(() => {
        if (onChange) {
            onChange(rows, totals);
        }
    }, [rows, totals, onChange]);

    const addRow = () => {
        setRows([...rows, { id: nanoid() }]);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, field: string, value: any) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const toggleAddOn = (addonId: string, isQuantity: boolean = false) => {
        handleSetAddOns(prev => {
            const current = prev[addonId];
            if (isQuantity) {
                return { ...prev, [addonId]: typeof current === 'number' ? current + 1 : 1 };
            }
            return { ...prev, [addonId]: !current };
        });
    };

    const decrementAddOn = (addonId: string) => {
        handleSetAddOns(prev => {
            const current = prev[addonId];
            if (typeof current === 'number' && current > 0) {
                return { ...prev, [addonId]: current - 1 };
            }
            return { ...prev, [addonId]: 0 };
        });
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
    };

    const formatPrice = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
    };

    // Group add-ons by category
    const groupedAddOns = useMemo(() => {
        if (!schema.addOns) return {};
        return schema.addOns.reduce((acc, addon) => {
            const category = addon.category || 'Other Services';
            if (!acc[category]) acc[category] = [];
            acc[category].push(addon);
            return acc;
        }, {} as Record<string, typeof schema.addOns>);
    }, [schema.addOns]);

    const isLight = theme === 'light';

    return (
        <div className={`space-y-6 ${isLight ? 'p-6' : ''}`}>
            {/* Tier Selection */}
            {hasTiers && schema.tiers && schema.tiers.length > 0 && (
                <div className="space-y-4">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        <span className="text-xl">🎯</span>
                        Select Your Tier
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {schema.tiers.map((tier, index) => (
                            <TierCard
                                key={tier.id}
                                tier={tier}
                                index={index}
                                isSelected={selectedTier?.id === tier.id}
                                isLight={isLight}
                                onSelect={() => handleSetTier(selectedTier?.id === tier.id ? null : tier)}
                                formatCurrency={formatCurrency}
                                formatPrice={formatPrice}
                            />
                        ))}
                    </div>

                    {/* Selected Tier Features */}
                    {selectedTier && selectedTier.features && selectedTier.features.length > 0 && (
                        <div className={`p-4 rounded-xl border ${isLight ? 'bg-[#FAF3CD]/50 border-[#FFC917]/30' : 'bg-[#8C0000]/10 border-[#8C0000]/20'}`}>
                            <h4 className={`font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                Included in {selectedTier.name}:
                            </h4>
                            <ul className="space-y-1">
                                {selectedTier.features.map((feature, idx) => (
                                    <li key={idx} className={`text-sm flex items-start gap-2 ${isLight ? 'text-gray-700' : 'text-white/70'}`}>
                                        <span className="text-[#8C0000] mt-0.5">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Add-ons Section - Grouped by Category */}
            {schema.addOns && schema.addOns.length > 0 && (
                <div className="space-y-6">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        <span className="text-xl">⚡</span>
                        Add-On Services
                    </h3>

                    {Object.entries(groupedAddOns).map(([category, addons]) => (
                        <div key={category} className="space-y-3">
                            {/* Category Header */}
                            <div className={`flex items-center gap-2 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                                <div className={`p-1.5 rounded-lg ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/60'}`}>
                                    {getCategoryIcon(category)}
                                </div>
                                <span className={`text-sm font-semibold ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
                                    {category}
                                </span>
                            </div>

                            {/* Add-ons in this category */}
                            <div className="space-y-2">
                                {addons.map((addon) => {
                                    const isActive = !!addOnStates[addon.id];
                                    const quantity = typeof addOnStates[addon.id] === 'number' ? addOnStates[addon.id] : 0;
                                    const isPerUnit = addon.priceType === 'per-unit';

                                    return (
                                        <div
                                            key={addon.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive
                                                ? isLight
                                                    ? 'border-[#8C0000]/30 bg-[#8C0000]/5'
                                                    : 'border-[#8C0000]/50 bg-[#8C0000]/10'
                                                : isLight
                                                    ? 'border-gray-200 bg-white hover:border-gray-300'
                                                    : 'border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                    {addon.name}
                                                </h4>
                                                <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                                                    {addon.description}
                                                </p>
                                                <p className={`text-sm font-semibold mt-1 ${isLight ? 'text-[#CD8417]' : 'text-[#8C0000]'}`}>
                                                    {formatPrice(addon.price)}
                                                    <span className={`font-normal ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                                                        /{addon.priceType === 'monthly' ? 'mo' : addon.priceType === 'one-time' ? 'once' : 'unit'}
                                                    </span>
                                                </p>
                                            </div>

                                            {isPerUnit ? (
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => decrementAddOn(addon.id)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLight
                                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className={`w-8 text-center font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleAddOn(addon.id, true)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive
                                                            ? 'bg-[#8C0000] text-white'
                                                            : isLight
                                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => toggleAddOn(addon.id)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ml-4 ${isActive
                                                        ? 'bg-[#8C0000] text-white shadow-md'
                                                        : isLight
                                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                        }`}
                                                >
                                                    {isActive ? 'Added' : 'Add'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Itemized Line Items - Only show for pure itemized layout */}
            {layoutType === 'itemized' && schema.columns && schema.columns.length > 0 && (
                <div className={`space-y-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`flex items-center gap-2 transition-colors ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}
                    >
                        <span className={`transition-transform ${showDetails ? 'rotate-90' : ''}`}>▶</span>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-2xl">📋</span>
                            Detailed Breakdown
                        </h3>
                    </button>

                    {showDetails && (
                        <div className={`overflow-x-auto rounded-xl border ${isLight ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5 backdrop-blur-sm'} animate-in fade-in slide-in-from-top-4 duration-300`}>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={isLight ? 'bg-gray-50' : 'bg-white/5'}>
                                        {schema.columns.map(col => (
                                            <th key={col.id} className={`p-4 border-b font-medium text-sm uppercase tracking-wider ${isLight ? 'border-gray-200 text-gray-600' : 'border-white/10 text-white/60'}`}>
                                                {col.label}
                                            </th>
                                        ))}
                                        <th className={`p-4 border-b w-10 ${isLight ? 'border-gray-200' : 'border-white/10'}`}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.id} className={`group transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}>
                                            {schema.columns?.map(col => (
                                                <td key={col.id} className={`p-3 border-b ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                                                    {col.type === 'formula' ? (
                                                        <div className={`font-mono font-medium ${isLight ? 'text-[#CD8417]' : 'text-[#8C0000]'}`}>
                                                            {formatPrice(calculateFormula(col.formula || '0', row))}
                                                        </div>
                                                    ) : col.type === 'select' ? (
                                                        <select
                                                            className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${isLight
                                                                ? 'bg-white border-gray-200 text-gray-900 focus:border-[#8C0000]'
                                                                : 'bg-transparent border-white/10 text-white focus:border-[#8C0000]'
                                                                }`}
                                                            value={row[col.id] || ''}
                                                            onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                                                        >
                                                            <option value="" className={isLight ? '' : 'bg-gray-900'}>Select...</option>
                                                            {col.options?.map(opt => (
                                                                <option key={opt} value={opt} className={isLight ? '' : 'bg-gray-900'}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                                                            className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${isLight
                                                                ? 'bg-white border-gray-200 text-gray-900 focus:border-[#8C0000] placeholder-gray-400'
                                                                : 'bg-transparent border-white/10 text-white focus:border-[#8C0000] placeholder-white/20'
                                                                }`}
                                                            value={row[col.id] || ''}
                                                            onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                                                            placeholder={col.label}
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className={`p-3 border-b text-right ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                                                <button
                                                    onClick={() => removeRow(row.id)}
                                                    className={`p-1 rounded-lg transition-colors ${isLight ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' : 'text-white/20 hover:text-red-400 hover:bg-white/5'}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                                <button
                                    onClick={addRow}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border ${isLight
                                        ? 'text-[#8C0000] hover:bg-[#8C0000]/10 border-[#8C0000]/20 hover:border-[#8C0000]/40'
                                        : 'text-[#8C0000] hover:text-[#A00000] hover:bg-[#8C0000]/10 border-[#8C0000]/20 hover:border-[#8C0000]/40'
                                        }`}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Line Item
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
