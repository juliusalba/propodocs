import { Waves, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
            <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl font-bold mb-4" style={{ background: 'linear-gradient(to right, #7A1E1E, #501010)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        VMG Pricing Calculators
                    </h1>
                    <p className="text-xl text-gray-600">
                        Select the calculator you'd like to access
                    </p>
                </div>

                {/* Calculator Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* VMG Marketing Calculator */}
                    <button
                        onClick={() => navigate('/vmg')}
                        className="group bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7A1E1E] text-left relative overflow-hidden"
                    >
                        {/* Background Gradient on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>

                        <div className="relative">
                            {/* Icon */}
                            <div className="mb-6 p-4 rounded-xl shadow-md inline-block" style={{ background: 'linear-gradient(135deg, #7A1E1E 0%, #501010 100%)' }}>
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                VMG Marketing
                            </h2>

                            {/* Description */}
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Comprehensive digital marketing services including Traffic Driver, Retention & CRM, and Creative Support packages.
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7A1E1E' }}></div>
                                    Traffic Driver Retainers
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7A1E1E' }}></div>
                                    Retention & CRM Services
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7A1E1E' }}></div>
                                    Creative Support Packages
                                </li>
                            </ul>

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#7A1E1E' }}>
                                Access Calculator
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </button>

                    {/* Marine & Powersports Calculator */}
                    <button
                        onClick={() => navigate('/marine')}
                        className="group bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7A1E1E] text-left relative overflow-hidden"
                    >
                        {/* Background Gradient on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-cyan-100/0 group-hover:from-blue-50/50 group-hover:to-cyan-100/30 transition-all duration-300"></div>

                        <div className="relative">
                            {/* Icon */}
                            <div className="mb-6 p-4 rounded-xl shadow-md inline-block" style={{ background: 'linear-gradient(135deg, #7A1E1E 0%, #501010 100%)' }}>
                                <Waves className="w-8 h-8 text-white" />
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                Marine & Powersports
                            </h2>

                            {/* Description */}
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                All-In growth playbook for marine dealers, powersports retailers, and brokerages. One monthly number, more buyers.
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7A1E1E' }}></div>
                                    WAKE / HARBOR / OFFSHORE Tiers
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7A1E1E' }}></div>
                                    Inventory-Aware Campaigns
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7A1E1E' }}></div>
                                    Speed-to-Lead Automation
                                </li>
                            </ul>

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#7A1E1E' }}>
                                Access Calculator
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-gray-500 text-sm">
                    <p>Need help? Contact our team for personalized assistance.</p>
                </div>
            </div>
        </div>
    );
}
