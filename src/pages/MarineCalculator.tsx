import { useState, useMemo } from 'react';
import { Waves, Ship, Anchor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marineTiers } from '../data/marinePricingData';
import { MarineAddOnsSection } from '../components/MarineAddOnsSection';
import type { MarineAddOnsState } from '../types/marine';

export function MarineCalculator() {
    const navigate = useNavigate();

    const [selectedTier, setSelectedTier] = useState<'wake' | 'harbor' | 'offshore' | null>(null);
    const [clientName, setClientName] = useState('');

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

    const handleAddonUpdate = (key: keyof MarineAddOnsState, value: any) => {
        setAddOns(prev => ({
            ...prev,
            [key]: value
        }));
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

    const handleExportPDF = async () => {
        try {
            const response = await fetch('http://localhost:3001/generate-marine-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientName,
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
            a.download = `VMG-Marine-Quote-${clientName || 'Client'}-${new Date().toISOString().split('T')[0]}.pdf`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            console.log('Marine PDF downloaded successfully');
        } catch (error) {
            console.error('Error generating Marine PDF:', error);
            alert('Failed to generate PDF. Please ensure the PDF server is running.');
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
                    >
                        ← Back to Calculator Selection
                    </button>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #7A1E1E 0%, #501010 100%)' }}>
                                <Waves className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Marine & Powersports Calculator</h1>
                                <p className="text-gray-600">All-In Growth Playbook — One monthly number. More buyers.</p>
                            </div>
                        </div>

                        <input
                            type="text"
                            placeholder="Client/Dealer Name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7A1E1E] focus:outline-none transition-colors"
                        />
                    </div>
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
                                                ? 'border-[#7A1E1E] shadow-lg shadow-red-100 scale-[1.02]'
                                                : 'bg-white border-gray-200 hover:border-[#7A1E1E] hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                            style={isSelected ? { background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' } : {}}
                                        >
                                            {!isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>
                                            )}

                                            <div className="relative">
                                                <div className="mb-3 p-2 rounded-lg inline-block" style={{ background: 'linear-gradient(135deg, #7A1E1E 0%, #501010 100%)' }}>
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
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-xl sticky top-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <div className="p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(135deg, #7A1E1E 0%, #501010 100%)' }}>
                                    <span className="text-white">💰</span>
                                </div>
                                Quote Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                                    <span className="text-gray-600 font-semibold">Monthly:</span>
                                    <span className="text-3xl font-bold" style={{ background: 'linear-gradient(to right, #7A1E1E, #501010)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        ${Math.round(totals.monthlyTotal).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                                    <span className="text-gray-600 font-semibold">Setup Fee:</span>
                                    <span className="text-xl font-bold text-gray-700">${totals.setupTotal.toLocaleString()}</span>
                                </div>

                                {totals.oneTimeTotal > 0 && (
                                    <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                                        <span className="text-gray-600 font-semibold">One-Time:</span>
                                        <span className="text-xl font-bold text-gray-700">${totals.oneTimeTotal.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl px-4 -mx-2">
                                    <span className="text-gray-700 font-semibold">6-Month Value:</span>
                                    <span className="text-2xl font-bold text-emerald-600">
                                        ${Math.round(totals.annualTotal).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {totals.monthlyTotal > 0 && (
                                <>
                                    <button
                                        onClick={handleExportPDF}
                                        className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-[#7A1E1E] to-[#501010] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 0 01-2 2z" />
                                        </svg>
                                        Export PDF
                                    </button>

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
        </div >
    );
}
