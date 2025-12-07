import { useState, useMemo, useEffect } from 'react';
import { Waves, Ship, Anchor, ArrowLeft, FileDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { marineTiers } from '../data/marinePricingData';
import { MarineAddOnsSection } from '../components/MarineAddOnsSection';
import { ProposalButton } from '../components/ProposalButton';
import { ClientDetailsForm, type ClientDetails } from '../components/ClientDetailsForm';
import { QuoteSummary } from '../components/QuoteSummary';
import { api } from '../lib/api';
import type { MarineAddOnsState } from '../types/marine';
import { useToast } from '../components/Toast';

export function MarineCalculator() {
    const navigate = useNavigate();
    const toast = useToast();

    const [selectedTier, setSelectedTier] = useState<'wake' | 'harbor' | 'offshore' | null>(null);
    const [clientDetails, setClientDetails] = useState<ClientDetails>({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: ''
    });
    const [searchParams] = useSearchParams();
    const proposalId = searchParams.get('id');

    useEffect(() => {
        if (proposalId) {
            loadProposal(Number(proposalId));
        }
    }, [proposalId]);

    const loadProposal = async (id: number) => {
        try {
            const response = await api.getProposal(id);
            const proposal = response.proposal; // API returns { proposal: ... }
            if (proposal && proposal.calculator_data) {
                const data = proposal.calculator_data;
                if (data.selectedTier) setSelectedTier(data.selectedTier);
                if (data.addOns) setAddOns(data.addOns);

                setClientDetails({
                    name: proposal.client_name || '',
                    company: proposal.client_company || '',
                    email: proposal.client_email || '',
                    phone: proposal.client_phone || '',
                    address: proposal.client_address || ''
                });
            }
        } catch (error) {
            console.error('Failed to load proposal:', error);
        }
    };

    const [addOns, setAddOns] = useState<MarineAddOnsState>({
        aiChat: false,
        dmFunnels: false,
        emailSms: 0,
        bdcLite: false,
        creativeBoost: false,
        croWebSprint: 0,
        inventoryFeedMgmt: false,
        localSeoBasic: false,
        localSeoPro: false,
        reputationMgmt: false,
        showBurst: 0,
        spanishCreative: false,
        onsiteProduction: 0,
        topUps: 0
    });

    const handleAddonUpdate = (key: keyof MarineAddOnsState, value: unknown) => {
        setAddOns(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleClientDetailsChange = (key: keyof ClientDetails, value: string) => {
        setClientDetails(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleExportPDF = async () => {
        try {
            const response = await fetch('http://localhost:3001/generate-marine-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientName: clientDetails.name,
                    clientDetails,
                    selectedTier,
                    addOns,
                    totals,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`PDF generation failed: ${errorText}`);
            }

            const blob = await response.blob();
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Marine-Quote-${clientDetails.name || 'Client'}-${new Date().toISOString().split('T')[0]}.pdf`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            console.log('PDF downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again.');
        }
    };


    const totals = useMemo(() => {
        let monthlyTotal = 0;
        let setupTotal = 0;
        let oneTimeTotal = 0;

        // Base tier
        if (selectedTier) {
            const tier = marineTiers[selectedTier];
            monthlyTotal += tier.monthly;
            setupTotal += tier.setup;
        }

        // Add-ons
        if (addOns.aiChat) monthlyTotal += 400;
        if (addOns.dmFunnels) monthlyTotal += 400;
        if (addOns.emailSms > 0) {
            if (addOns.emailSms >= 4) {
                monthlyTotal += 1500;
            } else {
                oneTimeTotal += addOns.emailSms * 600;
            }
        }
        if (addOns.bdcLite) monthlyTotal += 1500;
        if (addOns.creativeBoost) monthlyTotal += 750;
        if (addOns.croWebSprint > 0) oneTimeTotal += addOns.croWebSprint * 3500;
        if (addOns.inventoryFeedMgmt) {
            setupTotal += 1500;
            monthlyTotal += 750;
        }
        if (addOns.localSeoBasic) monthlyTotal += 399;
        if (addOns.localSeoPro) monthlyTotal += 799;
        if (addOns.reputationMgmt) monthlyTotal += 750;
        if (addOns.showBurst > 0) oneTimeTotal += addOns.showBurst * 2000;
        if (addOns.spanishCreative) monthlyTotal += 500;
        if (addOns.onsiteProduction > 0) oneTimeTotal += addOns.onsiteProduction * 2500;
        if (addOns.topUps > 0) monthlyTotal += addOns.topUps * 3000;

        const annualTotal = monthlyTotal * 6 + setupTotal + oneTimeTotal;

        return { monthlyTotal, setupTotal, oneTimeTotal, annualTotal };
    }, [selectedTier, addOns]);

    const getTierIcon = (tier: 'wake' | 'harbor' | 'offshore') => {
        switch (tier) {
            case 'wake': return <Waves className="w-6 h-6" />;
            case 'harbor': return <Anchor className="w-6 h-6" />;
            case 'offshore': return <Ship className="w-6 h-6" />;
        }
    };




    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                                <Waves className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Marine & Powersports Calculator</h1>
                                <p className="text-gray-600">All-In Growth Playbook — One monthly number. More buyers.</p>
                            </div>
                        </div>
                    </div>

                    <ClientDetailsForm details={clientDetails} onChange={handleClientDetailsChange} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Tiers & Add-ons */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tier Selection */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                Select Your Tier
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(Object.keys(marineTiers) as Array<'wake' | 'harbor' | 'offshore'>).map((tierKey) => {
                                    const tier = marineTiers[tierKey];
                                    const isSelected = selectedTier === tierKey;

                                    return (
                                        <button
                                            key={tierKey}
                                            onClick={() => setSelectedTier(isSelected ? null : tierKey)}
                                            className={`group text-left p-5 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${isSelected
                                                ? 'border-[#3b82f6] shadow-lg shadow-red-100 scale-[1.02]'
                                                : 'bg-white border-gray-200 hover:border-[#3b82f6] hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                            style={isSelected ? { background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' } : {}}
                                        >
                                            {!isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>
                                            )}

                                            <div className="relative">
                                                <div className="mb-3 p-2 rounded-lg inline-block" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                                                    <div className="text-white">{getTierIcon(tierKey)}</div>
                                                </div>

                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                                                <p className="text-xs text-gray-600 mb-3">{tier.description}</p>

                                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                                    ${(tier.monthly / 1000).toFixed(0)}K
                                                    <span className="text-sm font-normal text-gray-500">/mo</span>
                                                </div>

                                                <div className="text-xs text-gray-500 mb-3">
                                                    +${tier.setup.toLocaleString()} setup
                                                </div>

                                                <div className="text-xs text-emerald-600 font-medium border-t border-gray-200 pt-3">
                                                    ${(tier.mediaIncluded / 1000).toFixed(1)}K media included
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedTier && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2">Included in {marineTiers[selectedTier].name}:</h4>
                                    <ul className="space-y-1">
                                        {marineTiers[selectedTier].features.map((feature, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-emerald-600 mt-0.5">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Add-ons Section */}
                        <MarineAddOnsSection addOns={addOns} onUpdate={handleAddonUpdate} />
                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">


                        {totals.monthlyTotal > 0 && (
                            <>
                                <QuoteSummary
                                    monthlyTotal={totals.monthlyTotal}
                                    setupTotal={totals.setupTotal}
                                    annualTotal={totals.annualTotal}
                                    margin={100} // Marine calculator doesn't track margin yet
                                    action={
                                        <div className="flex flex-col gap-3 mt-8">
                                            <ProposalButton
                                                clientName={clientDetails.name}
                                                clientDetails={clientDetails}
                                                calculatorType="marine"
                                                calculatorData={{
                                                    selectedTier,
                                                    addOns,
                                                    tierDetails: selectedTier ? marineTiers[selectedTier] : null
                                                }}
                                                totals={totals}
                                                onValidate={() => {
                                                    if (!clientDetails.name) {
                                                        toast.error('Please enter a client name');
                                                        return false;
                                                    }
                                                    if (!selectedTier) {
                                                        toast.error('Please select a tier');
                                                        return false;
                                                    }
                                                    return true;
                                                }}
                                            />
                                            {proposalId && (
                                                <button
                                                    onClick={() => navigate(`/proposals/${proposalId}/edit`)}
                                                    className="w-full bg-white border-2 border-[#3b82f6] text-[#3b82f6] font-bold py-3 px-6 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Back to Editor
                                                </button>
                                            )}
                                            <button
                                                onClick={handleExportPDF}
                                                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                Export as PDF
                                            </button>
                                        </div>
                                    }
                                />

                                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        <strong>6-month term</strong> • <strong>&lt;5-minute response SLA</strong> • Setup fee covers onboarding + strategy
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
