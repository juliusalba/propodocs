import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, Calendar } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { DynamicCalculator } from '../components/calculators/DynamicCalculator';
import { ProposalButton } from '../components/ProposalButton';
import { QuoteSummaryEnhanced, type LineItem } from '../components/QuoteSummaryEnhanced';
import { ServiceBreakdownTable, getServiceDetails } from '../components/ServiceBreakdownTable';
import type { ClientDetails } from '../components/ClientDetailsForm';
import { useToast } from '../components/Toast';
import type { CalculatorDefinition, CalculatorRow, CalculatorTier, CalculatorTotals } from '../types/calculator';
import type { Proposal } from '../types';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';

export function CustomCalculatorUsage() {
    const navigate = useNavigate();
    const { id: calculatorId } = useParams();
    const [searchParams] = useSearchParams();
    const proposalId = searchParams.get('id');
    const toast = useToast();

    const [calculator, setCalculator] = useState<CalculatorDefinition | null>(null);

    // Lifted state for calculator
    const [rows, setRows] = useState<CalculatorRow[]>([]);
    const [selectedTier, setSelectedTier] = useState<CalculatorTier | null>(null);
    const [addOnStates, setAddOnStates] = useState<Record<string, boolean | number>>({});

    // Contract terms
    const [contractTerm, setContractTerm] = useState<'6' | '12'>('6');

    // Totals from DynamicCalculator
    const [calculatorTotals, setCalculatorTotals] = useState<CalculatorTotals>({
        monthlyTotal: 0,
        setupTotal: 0,
        oneTimeTotal: 0,
        annualTotal: 0
    });

    const [discountData, setDiscountData] = useState<{ discount: number; discountType: 'percent' | 'fixed' }>({ discount: 0, discountType: 'percent' });
    const [clientDetails, setClientDetails] = useState<ClientDetails>({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: ''
    });

    const [existingProposal, setExistingProposal] = useState<Proposal | null>(null);

    useEffect(() => {
        if (calculatorId) {
            loadCalculator(calculatorId);
        }
    }, [calculatorId]);

    useEffect(() => {
        if (proposalId) {
            loadProposal(Number(proposalId));
        }
    }, [proposalId]);

    const loadCalculator = async (id: string) => {
        try {
            const data = await api.getCalculator(id);
            setCalculator(data);
        } catch (error) {
            console.error('Failed to load calculator:', error);
            toast.error('Failed to load calculator definition');
        }
    };

    const loadProposal = async (id: number) => {
        try {
            const response = await api.getProposal(id);
            const proposal = response.proposal;
            if (proposal) {
                setExistingProposal(proposal);
                setClientDetails({
                    name: proposal.client_name || '',
                    company: proposal.client_company || '',
                    email: proposal.client_email || '',
                    phone: proposal.client_phone || '',
                    address: proposal.client_address || ''
                });

                if (proposal.calculator_data) {
                    const data = proposal.calculator_data;
                    if (data.rows) setRows(data.rows);
                    if (data.discount) setDiscountData(data.discount);
                    if (data.selectedTier) setSelectedTier(data.selectedTier);
                    if (data.addOnStates) setAddOnStates(data.addOnStates);
                    if (data.contractTerm) setContractTerm(data.contractTerm);
                }
            }
        } catch (error) {
            console.error('Failed to load proposal:', error);
        }
    };

    const handleClientDetailsChange = (key: keyof ClientDetails, value: string) => {
        setClientDetails(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleCalculatorChange = (
        newRows: CalculatorRow[],
        newTotals: CalculatorTotals
    ) => {
        setRows(newRows);
        // Apply contract discount
        let adjustedMonthly = newTotals.monthlyTotal;
        if (contractTerm === '12') {
            adjustedMonthly = newTotals.monthlyTotal * 0.95; // 5% discount
        }
        setCalculatorTotals({
            ...newTotals,
            monthlyTotal: adjustedMonthly,
            annualTotal: adjustedMonthly * 12 + newTotals.setupTotal + newTotals.oneTimeTotal
        });
    };

    // Recompute totals when contract term changes
    useEffect(() => {
        // The DynamicCalculator's onChange will handle recalculation
        // This effect is here for any manual adjustments if needed in the future
    }, [contractTerm]);

    // Compute line items from selections
    const lineItems = useMemo((): LineItem[] => {
        const items: LineItem[] = [];

        // Add selected add-ons
        if (calculator?.schema.addOns) {
            calculator.schema.addOns.forEach(addon => {
                const state = addOnStates[addon.id];
                if (state) {
                    const quantity = typeof state === 'number' ? state : 1;
                    if (quantity > 0) {
                        items.push({
                            id: addon.id,
                            name: addon.name,
                            description: addon.description,
                            price: addon.price,
                            quantity,
                            priceType: addon.priceType === 'per-unit' ? 'one-time' : addon.priceType,
                            total: addon.price * quantity
                        });
                    }
                }
            });
        }

        return items;
    }, [calculator, addOnStates]);

    // Auto-generate scope based on selections
    const generatedScope = useMemo(() => {
        const scopeParts: string[] = [];

        if (selectedTier) {
            scopeParts.push(`${selectedTier.name} Tier Package:`);
            if (selectedTier.features && selectedTier.features.length > 0) {
                selectedTier.features.forEach(feature => {
                    scopeParts.push(`• ${feature}`);
                });
            }
        }

        const selectedAddOns = lineItems.filter(item => item.priceType === 'monthly' || item.priceType === 'one-time');
        if (selectedAddOns.length > 0) {
            scopeParts.push('');
            scopeParts.push('Additional Services:');
            selectedAddOns.forEach(addon => {
                const qtyText = addon.quantity > 1 ? ` (×${addon.quantity})` : '';
                scopeParts.push(`• ${addon.name}${qtyText}`);
            });
        }

        return scopeParts.join('\n');
    }, [selectedTier, lineItems]);

    const handleExportPDF = async () => {
        if (!calculator) return;

        if (!clientDetails.name.trim()) {
            toast.error('Please enter a client name before exporting');
            return;
        }

        try {
            const blob = await api.generateCustomPDF({
                clientName: clientDetails.name,
                calculatorName: calculator.name,
                rows,
                totals: calculatorTotals,
                discount: discountData,
                clientDetails,
                scope: generatedScope,
                selectedTier,
                selectedAddOns: lineItems.filter(item => item.priceType === 'monthly' || item.priceType === 'one-time'),
                detailedBreakdown: {
                    tier: selectedTier ? getServiceDetails(selectedTier.name, selectedTier.description) : null,
                    addOns: lineItems
                        .filter(item => item.priceType === 'monthly' || item.priceType === 'one-time')
                        .map(addon => getServiceDetails(addon.name, addon.description))
                }
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${calculator.name.replace(/\s+/g, '-')}-${clientDetails.name || 'Client'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('PDF downloaded successfully');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            toast.error('Failed to generate PDF. Please try again.');
        }
    };

    const handleSave = async (status: 'draft' | 'sent') => {
        if (!calculator) return;

        try {
            const currentCalculatorData = {
                calculatorDefinitionId: calculator.id,
                rows,
                discount: discountData,
                totals: calculatorTotals,
                scope: generatedScope,
                selectedTier,
                addOnStates,
                contractTerm,
                lineItems,
                detailedBreakdown: {
                    tier: selectedTier ? getServiceDetails(selectedTier.name, selectedTier.description) : null,
                    addOns: lineItems
                        .filter(item => item.priceType === 'monthly' || item.priceType === 'one-time')
                        .map(addon => getServiceDetails(addon.name, addon.description))
                }
            };

            const newProposal = {
                title: `${calculator.name} - ${clientDetails.name}`,
                clientName: clientDetails.name,
                clientCompany: clientDetails.company,
                clientEmail: clientDetails.email,
                clientPhone: clientDetails.phone,
                clientAddress: clientDetails.address,
                calculatorType: 'custom' as const,
                calculatorData: currentCalculatorData,
                status: status
            };

            if (existingProposal) {
                await api.updateProposal(existingProposal.id, newProposal);
                toast.success('Proposal updated');
            } else {
                const response = await api.createProposal(newProposal);
                toast.success('Proposal saved as draft');
                if (response.proposal?.id) {
                    navigate(`/calculators/${calculator.id}?id=${response.proposal.id}`, { replace: true });
                }
            }
        } catch (error) {
            console.error('Failed to save proposal:', error);
            toast.error('Failed to save proposal');
        }
    };

    if (!calculator) {
        return (
            <DashboardLayout disablePadding>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout disablePadding>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/calculators')}
                            className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Calculator Selection
                        </button>

                        {/* Calculator Header Card */}
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                                    <Calculator className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-[#3b82f6] uppercase tracking-wide">{calculator.name}</h1>
                                    <p className="text-gray-600 text-sm">{calculator.description || 'Pricing Calculator'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client Name Input - Centered */}
                    <div className="mb-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-lg mx-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Client / Dealer Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter client or dealer name"
                                value={clientDetails.name}
                                onChange={(e) => handleClientDetailsChange('name', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 outline-none transition-all text-center text-gray-700 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Calculator & Options */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Calculator Component */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <DynamicCalculator
                                    schema={calculator.schema}
                                    initialData={rows}
                                    onChange={handleCalculatorChange}
                                    selectedTier={selectedTier}
                                    onSelectTier={setSelectedTier}
                                    addOnStates={addOnStates}
                                    onAddOnChange={setAddOnStates}
                                    theme="light"
                                />
                            </div>

                            {/* Contract Terms */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    Contract Terms
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${contractTerm === '6'
                                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="contract"
                                            value="6"
                                            checked={contractTerm === '6'}
                                            onChange={() => setContractTerm('6')}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">6 months</div>
                                            <div className="text-xs text-gray-500">Standard terms</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${contractTerm === '12'
                                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="contract"
                                            value="12"
                                            checked={contractTerm === '12'}
                                            onChange={() => setContractTerm('12')}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">12 months</div>
                                            <div className="text-xs text-emerald-600 font-medium">5% discount applied</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Service Breakdown Table */}
                            <ServiceBreakdownTable
                                selectedTier={selectedTier}
                                selectedAddOns={lineItems.filter(item => item.priceType === 'monthly' || item.priceType === 'one-time')}
                            />
                        </div>

                        {/* Right Column - Quote Summary */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-6 space-y-6">
                                <QuoteSummaryEnhanced
                                    selectedTier={selectedTier}
                                    lineItems={lineItems}
                                    totals={calculatorTotals}
                                    contractTerm={contractTerm}
                                    onExportPDF={handleExportPDF}
                                    onSaveDraft={() => handleSave('draft')}
                                    proposalButton={
                                        <ProposalButton
                                            clientName={clientDetails.name}
                                            clientDetails={clientDetails}
                                            calculatorType="custom"
                                            calculatorData={{
                                                calculatorDefinitionId: calculator.id,
                                                rows,
                                                discount: discountData,
                                                totals: calculatorTotals,
                                                scope: generatedScope,
                                                selectedTier,
                                                addOnStates,
                                                contractTerm,
                                                lineItems,
                                                detailedBreakdown: {
                                                    tier: selectedTier ? getServiceDetails(selectedTier.name, selectedTier.description) : null,
                                                    addOns: lineItems
                                                        .filter(item => item.priceType === 'monthly' || item.priceType === 'one-time')
                                                        .map(addon => getServiceDetails(addon.name, addon.description))
                                                }
                                            }}
                                            totals={calculatorTotals}
                                            onValidate={() => {
                                                if (!clientDetails.name) {
                                                    toast.error('Please enter a client name');
                                                    return false;
                                                }
                                                return true;
                                            }}
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
