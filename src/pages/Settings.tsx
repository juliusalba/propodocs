import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Building,
    Bell,
    Shield,
    Palette,
    Save,
    Camera,
    Mail,
    Phone,
    Globe,
    Key,
    Eye,
    EyeOff,
    Upload,
    CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

type TabType = 'profile' | 'company' | 'notifications' | 'security' | 'appearance' | 'payments';

export function Settings() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form states
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        avatar: ''
    });

    const [company, setCompany] = useState({
        name: user?.company || '',
        website: '',
        address: '',
        logo: user?.logo_url || '',
        signature: user?.signature_url || ''
    });

    // Sync state with user context
    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
                avatar: user.avatar_url || ''
            }));
            setCompany(prev => ({
                ...prev,
                name: user.company || '',
                logo: user.logo_url || '',
                signature: user.signature_url || ''
            }));
            if (user.bank_details || user.payment_preferences) {
                setPaymentDetails(prev => ({
                    ...prev,
                    ...user.bank_details,
                    ...user.payment_preferences
                }));
            }
            if (user.appearance) {
                setAppearance(prev => ({
                    ...prev,
                    ...user.appearance
                }));
            }
        }
    }, [user]);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const [notifications, setNotifications] = useState({
        emailProposalViewed: true,
        emailProposalAccepted: true,
        emailProposalRejected: true,
        emailWeeklyDigest: false,
        pushNotifications: true
    });

    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [appearance, setAppearance] = useState({
        theme: 'light',
        accentColor: '#3b82f6'
    });

    const [paymentDetails, setPaymentDetails] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '', // Sort Code
        swiftBic: '',
        iban: '',
        address: '',
        stripeLink: '',
        paypalLink: '',
        manualLink: ''
    });

    const tabs = [
        { id: 'profile' as TabType, label: 'Profile', icon: User },
        { id: 'company' as TabType, label: 'Company', icon: Building },
        { id: 'payments' as TabType, label: 'Payments', icon: CreditCard },
        { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
        { id: 'security' as TabType, label: 'Security', icon: Shield },
        { id: 'appearance' as TabType, label: 'Appearance', icon: Palette }
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upload avatar, signature and logo if they're base64 (newly uploaded)
            let avatarUrl = profile.avatar;
            let signatureUrl = company.signature;
            let logoUrl = company.logo;

            // If avatar is base64, upload it
            if (profile.avatar && profile.avatar.startsWith('data:')) {
                const formData = new FormData();
                const blob = await fetch(profile.avatar).then(r => r.blob());
                formData.append('file', blob, 'avatar.png');
                const response = await api.uploadFile(formData);
                avatarUrl = response.url;
            }

            // If signature is base64, upload it
            if (company.signature && company.signature.startsWith('data:')) {
                const formData = new FormData();
                const blob = await fetch(company.signature).then(r => r.blob());
                formData.append('file', blob, 'signature.png');
                const response = await api.uploadFile(formData);
                signatureUrl = response.url;
            }

            // If logo is base64, upload it
            if (company.logo && company.logo.startsWith('data:')) {
                const formData = new FormData();
                const blob = await fetch(company.logo).then(r => r.blob());
                formData.append('file', blob, 'logo.png');
                const response = await api.uploadFile(formData);
                logoUrl = response.url;
            }

            // Update user profile
            await api.updateProfile({
                name: profile.name,
                company: company.name,
                signature_url: signatureUrl,
                logo_url: logoUrl,
                avatar_url: avatarUrl,
                bank_details: {
                    bankName: paymentDetails.bankName,
                    accountName: paymentDetails.accountName,
                    accountNumber: paymentDetails.accountNumber,
                    routingNumber: paymentDetails.routingNumber,
                    swiftBic: paymentDetails.swiftBic,
                    iban: paymentDetails.iban,
                    address: paymentDetails.address
                },
                payment_preferences: {
                    stripeLink: paymentDetails.stripeLink,
                    paypalLink: paymentDetails.paypalLink,
                    manualLink: paymentDetails.manualLink
                },
                appearance: {
                    theme: appearance.theme,
                    accentColor: appearance.accentColor
                }
            });

            // Force reload user data to update context
            window.location.reload();

            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompany({ ...company, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompany({ ...company, signature: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // Redirect to login if not authenticated after loading completes
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [loading, user, navigate]);

    // Show loading spinner while auth is initializing
    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C0000]"></div>
                </div>
            </DashboardLayout>
        );
    }

    // Don't render anything if redirecting
    if (!user) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your account and preferences</p>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                                        ? 'bg-[#8C0000] text-white shadow-md shadow-[#8C0000]/20'
                                        : 'text-gray-600 hover:bg-[#FAF3CD] hover:text-[#050505]'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                        >
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>

                                    {/* Avatar */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            {profile.avatar ? (
                                                <img
                                                    src={profile.avatar}
                                                    alt="Profile"
                                                    className="w-24 h-24 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8C0000] to-[#500000] flex items-center justify-center text-white text-3xl font-bold">
                                                    {profile.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                                id="avatar-upload"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 cursor-pointer"
                                            >
                                                <Camera className="w-4 h-4 text-gray-600" />
                                            </label>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                                            <p className="text-gray-500 text-sm">{profile.email}</p>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Company Tab */}
                            {activeTab === 'company' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>

                                    {/* Logo Upload */}
                                    <div className="flex items-start gap-6 pb-6 border-b border-gray-100">
                                        <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                            {company.logo ? (
                                                <img src={company.logo} alt="Company Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <Building className="w-8 h-8 text-gray-400" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Company Logo</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Upload your company logo to be displayed on proposals and invoices.
                                                <br />
                                                Recommended size: 400x400px (PNG or JPG)
                                            </p>
                                            <div className="mt-3">
                                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <Upload className="w-4 h-4" />
                                                    Upload New Logo
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature Upload */}
                                    <div className="flex items-start gap-6 pb-6 border-b border-gray-100">
                                        <div className="w-48 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                            {company.signature ? (
                                                <img src={company.signature} alt="Agency Signature" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="text-gray-400 text-sm font-medium">No Signature</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSignatureUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Agency Signature</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Upload your default signature to be used on proposals.
                                                <br />
                                                Recommended: Transparent PNG
                                            </p>
                                            <div className="mt-3">
                                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <Upload className="w-4 h-4" />
                                                    Upload Signature
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleSignatureUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={company.name}
                                                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Website
                                            </label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="url"
                                                    value={company.website}
                                                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                                                    placeholder="https://example.com"
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                value={company.address}
                                                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                                rows={3}
                                                placeholder="Enter your company address"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'emailProposalViewed', label: 'Email when proposal is viewed', description: 'Get notified when a client views your proposal' },
                                            { key: 'emailProposalAccepted', label: 'Email when proposal is accepted', description: 'Get notified when a client accepts your proposal' },
                                            { key: 'emailProposalRejected', label: 'Email when proposal is rejected', description: 'Get notified when a client rejects your proposal' },
                                            { key: 'emailWeeklyDigest', label: 'Weekly digest', description: 'Receive a weekly summary of your proposal activity' },
                                            { key: 'pushNotifications', label: 'Push notifications', description: 'Receive push notifications in your browser' }
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{item.label}</h4>
                                                    <p className="text-sm text-gray-500">{item.description}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications[item.key as keyof typeof notifications]}
                                                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8C0000]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C0000]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={security.currentPassword}
                                                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                                                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={security.newPassword}
                                                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={security.confirmPassword}
                                                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8C0000]/20 focus:border-[#8C0000]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance Tab */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Appearance Settings</h2>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Theme
                                            </label>
                                            <div className="flex gap-4">
                                                {['light', 'dark', 'system'].map((theme) => (
                                                    <button
                                                        key={theme}
                                                        onClick={() => setAppearance({ ...appearance, theme })}
                                                        className={`px-6 py-3 rounded-lg border-2 font-medium capitalize transition-all ${appearance.theme === theme
                                                            ? 'border-[#8C0000] bg-[#8C0000]/5 text-[#8C0000]'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {theme}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Accent Color
                                            </label>
                                            <div className="flex gap-3">
                                                {['#3b82f6', '#1E3A7A', '#1E7A3A', '#7A1E7A', '#7A5A1E'].map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setAppearance({ ...appearance, accentColor: color })}
                                                        className={`w-10 h-10 rounded-full transition-all ${appearance.accentColor === color
                                                            ? 'ring-4 ring-offset-2 ring-gray-300'
                                                            : ''
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payments Tab */}
                            {activeTab === 'payments' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                                    <p className="text-sm text-gray-500">
                                        Save your banking details and payment links to auto-fill them on invoices.
                                    </p>

                                    {/* Bank Details */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-500" />
                                            Bank Account Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.accountName}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                                                    placeholder="e.g. Acme Corp Inc."
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bank Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.bankName}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                                    placeholder="e.g. Chase Bank"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.accountNumber}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Routing / Sort Code
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.routingNumber}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, routingNumber: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SWIFT / BIC
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.swiftBic}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, swiftBic: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    IBAN
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.iban}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, iban: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bank Address (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.address}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, address: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Links */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-gray-500" />
                                            Default Payment Links
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    General Payment Link (Default)
                                                </label>
                                                <input
                                                    type="url"
                                                    value={paymentDetails.manualLink}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, manualLink: e.target.value })}
                                                    placeholder="https://pay.example.com/me"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Stripe Detail / Link
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.stripeLink}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, stripeLink: e.target.value })}
                                                    placeholder="Stripe payment link or ID"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    PayPal Link
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentDetails.paypalLink}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, paypalLink: e.target.value })}
                                                    placeholder="paypal.me/username"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#8C0000] text-white rounded-xl font-semibold hover:bg-[#A00000] transition-all disabled:opacity-50 shadow-lg shadow-[#8C0000]/20"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}