import { useState, useMemo } from 'react';
import { Users, Zap, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ServiceCard } from '../components/ServiceCard';
import { AddonsSection } from '../components/AddonsSection';
import { ContractTerms } from '../components/ContractTerms';
import { QuoteSummary } from '../components/QuoteSummary';
import { DetailsModal } from '../components/DetailsModal';
import { UsageLog } from '../components/UsageLog';
import { services, addOnPrices } from '../data/pricingData';
import type { SelectedServices, AddOnsState } from '../types';

function VmgCalculator() {
  const navigate = useNavigate();

  // State
  const [selectedServices, setSelectedServices] = useState<SelectedServices>({
    traffic: null,
    retention: null,
    creative: null
  });

  const [addOns, setAddOns] = useState<AddOnsState>({
    landingPages: 0,
    funnels: 0,
    dashboard: false,
    workshop: null,
    videoPack: 0
  });

  const [contractTerm, setContractTerm] = useState<'6' | '12'>('6');
  const [clientName, setClientName] = useState<string>('');

  // Handlers
  const handleServiceSelect = (service: keyof SelectedServices, tier: number) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: tier === 0 ? null : tier
    }));
  };

  const handleAddonUpdate = (key: keyof AddOnsState, value: any) => {
    setAddOns(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('http://localhost:3001/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          selectedServices,
          addOns,
          contractTerm,
          totals,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generation failed: ${errorText}`);
      }

      // Get the PDF as a blob with explicit type
      const blob = await response.blob();

      // Ensure it's a PDF blob
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `VMG-Quote-${clientName || 'Client'}-${new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please ensure the PDF server is running.');
    }
  };

  // Calculations
  const totals = useMemo(() => {
    let monthlyTotal = 0;
    let setupTotal = 0;
    let internalCostTotal = 0;

    // Services
    (Object.entries(selectedServices) as [keyof typeof services, number | null][]).forEach(([key, tier]) => {
      if (tier && services[key].tiers[tier]) {
        const tierData = services[key].tiers[tier];
        monthlyTotal += tierData.monthly;
        setupTotal += tierData.setup;
        internalCostTotal += tierData.internalCost;
      }
    });

    // Add-ons
    monthlyTotal += addOns.landingPages * addOnPrices.landingPages;
    monthlyTotal += addOns.funnels * addOnPrices.funnels;
    monthlyTotal += addOns.videoPack * addOnPrices.videoPack;

    // Dashboard
    if (addOns.dashboard) {
      setupTotal += addOnPrices.dashboard.setup;
      monthlyTotal += addOnPrices.dashboard.monthly;
    }

    // Workshop
    if (addOns.workshop === 'halfDay') {
      monthlyTotal += addOnPrices.workshop.halfDay;
    } else if (addOns.workshop === 'fullDay') {
      monthlyTotal += addOnPrices.workshop.fullDay;
    }

    // Contract Discount
    if (contractTerm === '12') {
      monthlyTotal *= 0.95;
    }

    const annualTotal = monthlyTotal * 12 + setupTotal;
    const margin = monthlyTotal > 0 ? ((monthlyTotal - internalCostTotal) / monthlyTotal) * 100 : 0;

    return { monthlyTotal, setupTotal, annualTotal, margin };
  }, [selectedServices, addOns, contractTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to Calculator Selection
        </button>

        <Header clientName={clientName} onClientNameChange={setClientName} />

        {/* Usage Log */}
        <UsageLog />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Services & Addons */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Select Services
              </h2>

              <ServiceCard
                title={services.traffic.name}
                icon={<Users className="w-5 h-5" />}
                description="Lead generation through paid media management"
                tiers={services.traffic.tiers}
                selectedTier={selectedServices.traffic}
                onSelect={(tier) => handleServiceSelect('traffic', tier)}
              />

              <ServiceCard
                title={services.retention.name}
                icon={<Zap className="w-5 h-5" />}
                description="Email marketing and customer lifecycle management"
                tiers={services.retention.tiers}
                selectedTier={selectedServices.retention}
                onSelect={(tier) => handleServiceSelect('retention', tier)}
              />

              <ServiceCard
                title={services.creative.name}
                icon={<Palette className="w-5 h-5" />}
                description="Ad creative production and design services"
                tiers={services.creative.tiers}
                selectedTier={selectedServices.creative}
                onSelect={(tier) => handleServiceSelect('creative', tier)}
              />
            </div>

            <AddonsSection addOns={addOns} onUpdate={handleAddonUpdate} />
          </div>

          {/* Right Column - Contract & Summary */}
          <div className="space-y-6">
            <ContractTerms term={contractTerm} onChange={setContractTerm} />

            <div className="sticky top-6">
              <QuoteSummary
                monthlyTotal={totals.monthlyTotal}
                setupTotal={totals.setupTotal}
                annualTotal={totals.annualTotal}
                margin={totals.margin}
                onExportPDF={handleExportPDF}
              />

              <DetailsModal selectedServices={selectedServices} addOns={addOns} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VmgCalculator;
