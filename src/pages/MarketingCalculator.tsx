import { useState, useMemo, useEffect } from 'react';
import { Users, Zap, Palette, FileText, Sparkles, ArrowLeft, FileDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceCard } from '../components/ServiceCard';
import { AddonsSection } from '../components/AddonsSection';
import { ContractTerms } from '../components/ContractTerms';
import { ClientDetailsForm, type ClientDetails } from '../components/ClientDetailsForm';
import { QuoteSummary } from '../components/QuoteSummary';
import { DetailsModal } from '../components/DetailsModal';
import { UsageLog } from '../components/UsageLog';
import { services, addOnPrices } from '../data/pricingData';
import { api } from '../lib/api';
import type { SelectedServices, AddOnsState } from '../types';
import { useToast } from '../components/Toast';

function MarketingCalculator() {
  const toast = useToast();
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
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  });
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
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
        if (data.selectedServices) setSelectedServices(data.selectedServices);
        if (data.addOns) setAddOns(data.addOns);
        if (data.contractTerm) setContractTerm(data.contractTerm);

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
      toast.error('Failed to load proposal');
    }
  };

  // Handlers
  const handleServiceSelect = (service: keyof SelectedServices, tier: number) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: tier === 0 ? null : tier
    }));
  };

  const handleAddonUpdate = (key: keyof AddOnsState, value: unknown) => {
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
      const response = await fetch('http://localhost:3001/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientDetails.name,
          clientDetails,
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

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Quote-${clientDetails.name || 'Client'}-${new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleCreateBasicProposal = async () => {
    if (!clientDetails.name.trim()) {
      toast.error('Please enter a client name first');
      return;
    }

    setIsGenerating(true);
    try {
      const date = new Date().toLocaleDateString();
      const proposalData = {
        title: `${clientDetails.name} Proposal - ${date}`,
        clientName: clientDetails.name,
        clientCompany: clientDetails.company,
        clientEmail: clientDetails.email,
        clientPhone: clientDetails.phone,
        clientAddress: clientDetails.address,
        calculatorType: 'vmg',
        calculatorData: {
          selectedServices,
          addOns,
          contractTerm,
          totals
        }
      };

      // If updating existing proposal
      if (proposalId) {
        await api.updateProposal(Number(proposalId), {
          title: proposalData.title,
          calculator_data: proposalData.calculatorData
        });
        toast.success('Proposal updated successfully');
        navigate(`/proposals/${proposalId}/edit`);
      } else {
        // New proposal
        const response = await api.createProposal(proposalData);
        toast.success('Proposal created successfully');
        navigate(`/proposals/${response.proposal.id}/edit`);
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!clientDetails.name.trim()) {
      toast.error('Please enter a client name first');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // First generate AI content
      const aiResponse = await api.generateProposal({
        clientName: clientDetails.name,
        calculatorType: 'vmg',
        calculatorData: {
          selectedServices,
          addOns,
          contractTerm,
          totals
        }
      });

      // Then create the proposal with AI content
      const date = new Date().toLocaleDateString();
      const proposalData = {
        title: `${clientDetails.name} - ${date}`,
        clientName: clientDetails.name,
        clientCompany: clientDetails.company,
        clientEmail: clientDetails.email,
        clientPhone: clientDetails.phone,
        clientAddress: clientDetails.address,
        calculatorType: 'vmg',
        calculatorData: {
          selectedServices,
          addOns,
          contractTerm,
          totals,
          aiContent: aiResponse.content
        },
        content: aiResponse.content
      };

      const response = await api.createProposal(proposalData);
      setShowProposalModal(false);
      toast.success('AI Proposal generated successfully');
      navigate(`/proposals/${response.proposal.id}/edit`);
    } catch (error) {
      console.error('Error generating AI proposal:', error);
      toast.error('Failed to generate AI proposal. Please check if OpenAI API key is configured.');
    } finally {
      setIsGeneratingAI(false);
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
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pricing Calculator</h1>
                <p className="text-gray-600">Standard Pricing & Services</p>
              </div>
            </div>
          </div>

          <ClientDetailsForm details={clientDetails} onChange={handleClientDetailsChange} />
        </div>

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
                action={
                  totals.monthlyTotal > 0 ? (
                    <div className="flex flex-col gap-3 mt-8">
                      <button
                        onClick={() => setShowProposalModal(true)}
                        className="w-full text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
                        style={{ background: 'linear-gradient(to right, #3b82f6, #1d4ed8)' }}
                      >
                        <FileText className="w-5 h-5" />
                        {proposalId ? 'Update Proposal' : 'Generate Proposal'}
                      </button>
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
                  ) : undefined
                }
              />

              <DetailsModal selectedServices={selectedServices} addOns={addOns} />
            </div>
          </div>
        </div>
      </div>

      {/* Generate Proposal Modal */}
      <AnimatePresence>
        {showProposalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProposalModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Proposal</h2>
              <p className="text-gray-500 mb-6">Choose how you want to create your proposal for {clientDetails.name || 'this client'}</p>

              <div className="space-y-4">
                <button
                  onClick={handleCreateBasicProposal}
                  disabled={isGenerating || isGeneratingAI}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-red-50/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-[#3b82f6] transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {isGenerating ? 'Creating...' : 'Create Basic Proposal'}
                      </h3>
                      <p className="text-sm text-gray-500">Save the current quote as a draft proposal with standard formatting</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || isGeneratingAI}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                        {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Beta</span>
                      </h3>
                      <p className="text-sm text-gray-500">Use AI to create personalized proposal content tailored to the client</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowProposalModal(false)}
                className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MarketingCalculator;
