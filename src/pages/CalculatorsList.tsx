import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { CalculatorGuide } from '../components/calculators/CalculatorGuide';
import type { CalculatorDefinition } from '../types/calculator';
import { Plus, Calculator, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

export const CalculatorsList: React.FC = () => {
    const navigate = useNavigate();
    const [calculators, setCalculators] = useState<CalculatorDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCalculators = async () => {
            try {
                const data = await api.getCalculators();
                setCalculators(data);
            } catch (error) {
                console.error('Error fetching calculators:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCalculators();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this calculator?')) return;

        try {
            await api.deleteCalculator(id);
            setCalculators(calculators.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting calculator:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">My Calculators</h1>
                    <p className="text-gray-500 mt-1">Manage your custom AI-generated calculators.</p>
                </div>

                <button
                    onClick={() => navigate('/calculators/new')}
                    className="bg-[#8C0000] hover:bg-[#A00000] text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-[#8C0000]/20"
                >
                    <Plus size={20} />
                    New Calculator
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C0000]"></div>
                </div>
            ) : calculators.length === 0 ? (
                <div className="max-w-xl mx-auto">
                    <CalculatorGuide onCreateNew={() => navigate('/calculators/new')} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calculators.map(calc => (
                        <div
                            key={calc.id}
                            onClick={() => navigate(`/calculator/custom/${calc.id}`)}
                            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-[#FAF3CD] rounded-xl text-[#CD8417] group-hover:bg-[#FFC917]/20 transition-colors">
                                    <Calculator size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleDelete(calc.id, e)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-medium text-gray-900 mb-2">{calc.name}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                {calc.description || 'No description'}
                            </p>

                            <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                                <div className="text-xs text-gray-400">
                                    {new Date(calc.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/calculators/${calc.id}`);
                                        }}
                                        className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/calculator/custom/${calc.id}`);
                                        }}
                                        className="text-xs font-medium text-[#8C0000] hover:text-[#A00000] transition-colors"
                                    >
                                        Use Calculator
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
};
