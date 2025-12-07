import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { LayoutTemplate, ArrowRight, Star, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string | null;
    thumbnail_url: string | null;
    is_public: boolean;
    created_at: string;
}

export function Templates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [duplicating, setDuplicating] = useState<string | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await api.getTemplates();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async (templateId: string) => {
        try {
            setDuplicating(templateId);

            // Duplicate template to create new proposal
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/templates/${templateId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    clientName: 'New Client',
                }),
            });

            if (!response.ok) throw new Error('Failed to duplicate template');

            const { proposal } = await response.json();
            toast.success('Template duplicated! Redirecting to editor...');

            // Navigate to proposal editor
            navigate(`/proposals/${proposal.id}/edit`);
        } catch (error) {
            console.error('Failed to use template:', error);
            toast.error('Failed to use template');
        } finally {
            setDuplicating(null);
        }
    };

    const getCategoryColor = (category: string | null) => {
        const colors: Record<string, string> = {
            marketing: 'bg-purple-50 text-purple-700',
            development: 'bg-blue-50 text-blue-700',
            consulting: 'bg-green-50 text-green-700',
            design: 'bg-pink-50 text-pink-700',
        };
        return colors[category || ''] || 'bg-gray-50 text-gray-700';
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Proposal Templates</h1>
                            <p className="text-gray-500 mt-2">
                                Start with a pre-built proposal template and customize it for your client.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/templates/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#8C0000] text-white rounded-xl font-medium hover:bg-[#A00000] transition-colors shadow-lg shadow-[#8C0000]/20"
                        >
                            <LayoutTemplate className="w-5 h-5" />
                            Create Template
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
                        <p className="text-gray-500 mb-6">
                            Templates will appear here once you create them or when public templates are available.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-[#8C0000] transition-all group relative overflow-hidden"
                            >
                                {template.is_public && (
                                    <div className="absolute top-4 right-4">
                                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                            Public
                                        </div>
                                    </div>
                                )}

                                {template.thumbnail_url ? (
                                    <img
                                        src={template.thumbnail_url}
                                        alt={template.name}
                                        className="w-full h-40 object-cover rounded-lg mb-4"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-[#FAF3CD] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <LayoutTemplate className="w-6 h-6 text-[#CD8417]" />
                                    </div>
                                )}

                                {template.category && (
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(template.category)}`}>
                                        {template.category}
                                    </span>
                                )}

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                                    {template.description || 'No description available'}
                                </p>

                                <button
                                    onClick={() => handleUseTemplate(template.id)}
                                    disabled={duplicating === template.id}
                                    className="flex items-center text-[#8C0000] font-medium text-sm group-hover:gap-2 transition-all disabled:opacity-50"
                                >
                                    {duplicating === template.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Use Template <ArrowRight className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
