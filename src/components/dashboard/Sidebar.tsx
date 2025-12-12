import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Calculator,
    LayoutTemplate,
    Receipt,
    FileSignature
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Pipeline', path: '/pipeline' },
        { icon: FileText, label: 'Proposals', path: '/proposals' },
        { icon: Receipt, label: 'Invoices', path: '/invoices' },
        { icon: FileSignature, label: 'Contracts', path: '/contracts' },
        { icon: Calculator, label: 'My Calculators', path: '/calculators' },
        { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
        { icon: Users, label: 'Clients', path: '/clients' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 80 : 240 }}
            className="sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col relative z-20 shadow-lg"
        >
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3 overflow-hidden border-b border-gray-100">
                {user?.logo_url ? (
                    <>
                        <img
                            src={user.logo_url}
                            alt="Company Logo"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 ring-2 ring-gray-100 hover:ring-[#8C0000] transition-all"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8C0000] to-[#500000] flex-shrink-0 shadow-md hidden" />
                    </>
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8C0000] to-[#500000] flex-shrink-0 shadow-md" />
                )}
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="font-bold text-xl text-gray-900 whitespace-nowrap"
                        >
                            {user?.company || 'Propodocs'}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                                ? 'bg-[#8C0000] text-white shadow-md shadow-[#8C0000]/20 scale-[1.02]'
                                : 'text-[#050505]/70 hover:bg-[#FAF3CD] hover:text-[#050505] hover:scale-[1.01]'
                            }
            `}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                            <span className="font-medium whitespace-nowrap">{item.label}</span>
                        )}
                    </NavLink>
                ))}
            </nav>


            {/* User & Logout */}
            <div className="p-4 border-t border-gray-200 space-y-1">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                    )}
                    {!collapsed && <span className="font-medium">Collapse</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>
        </motion.div>
    );
}
