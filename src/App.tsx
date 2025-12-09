import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from 'antd';
import { Analytics } from '@vercel/analytics/react';

// Lazy load all route components for code splitting
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Proposals = lazy(() => import('./pages/Proposals').then(m => ({ default: m.Proposals })));
const ProposalEditor = lazy(() => import('./pages/ProposalEditor').then(m => ({ default: m.ProposalEditor })));
const ProposalView = lazy(() => import('./pages/ProposalView').then(m => ({ default: m.ProposalView })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const AcceptanceSuccess = lazy(() => import('./pages/AcceptanceSuccess').then(m => ({ default: m.AcceptanceSuccess })));
const CalculatorBuilder = lazy(() => import('./pages/CalculatorBuilder').then(m => ({ default: m.CalculatorBuilder })));
const CalculatorsList = lazy(() => import('./pages/CalculatorsList').then(m => ({ default: m.CalculatorsList })));
const MarketingCalculator = lazy(() => import('./pages/MarketingCalculator'));
const CustomCalculatorUsage = lazy(() => import('./pages/CustomCalculatorUsage').then(m => ({ default: m.CustomCalculatorUsage })));
const Templates = lazy(() => import('./pages/Templates').then(m => ({ default: m.Templates })));
const InvoicesPage = lazy(() => import('./pages/Invoices'));
const InvoiceEditor = lazy(() => import('./pages/InvoiceEditor').then(m => ({ default: m.InvoiceEditor })));
const ContractsPage = lazy(() => import('./pages/Contracts'));
const ContractEditor = lazy(() => import('./pages/ContractEditor').then(m => ({ default: m.ContractEditor })));
const ContractSigning = lazy(() => import('./pages/ContractSigning').then(m => ({ default: m.ContractSigning })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <div className="text-white text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p>Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#8C0000', // Vogel Red
          colorBgBase: '#ffffff',  // Keep components white for contrast on cream background
          colorTextBase: '#050505', // Vogel Black
          colorBorder: '#CD8417',   // Vogel Gold
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/proposals" element={
              <ProtectedRoute>
                <Proposals />
              </ProtectedRoute>
            } />

            <Route path="/proposals/new" element={
              <ProtectedRoute>
                <ProposalEditor />
              </ProtectedRoute>
            } />

            <Route path="/proposals/:id/edit" element={
              <ProtectedRoute>
                <ProposalEditor />
              </ProtectedRoute>
            } />

            <Route path="/calculators" element={
              <ProtectedRoute>
                <CalculatorsList />
              </ProtectedRoute>
            } />

            <Route path="/calculators/new" element={
              <ProtectedRoute>
                <CalculatorBuilder />
              </ProtectedRoute>
            } />

            <Route path="/calculators/:id" element={
              <ProtectedRoute>
                <CalculatorBuilder />
              </ProtectedRoute>
            } />

            <Route path="/calculator/vmg" element={
              <ProtectedRoute>
                <MarketingCalculator />
              </ProtectedRoute>
            } />

            <Route path="/calculator/marketing" element={
              <ProtectedRoute>
                <MarketingCalculator />
              </ProtectedRoute>
            } />

            <Route path="/calculator/custom/:id" element={
              <ProtectedRoute>
                <CustomCalculatorUsage />
              </ProtectedRoute>
            } />

            <Route path="/templates" element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            } />

            <Route path="/invoices/new" element={
              <ProtectedRoute>
                <InvoiceEditor />
              </ProtectedRoute>
            } />

            <Route path="/invoices/:id" element={
              <ProtectedRoute>
                <InvoiceEditor />
              </ProtectedRoute>
            } />

            <Route path="/contracts" element={
              <ProtectedRoute>
                <ContractsPage />
              </ProtectedRoute>
            } />

            <Route path="/contracts/new" element={
              <ProtectedRoute>
                <ContractEditor />
              </ProtectedRoute>
            } />

            <Route path="/contracts/:id" element={
              <ProtectedRoute>
                <ContractEditor />
              </ProtectedRoute>
            } />

            <Route path="/contracts/:id/edit" element={
              <ProtectedRoute>
                <ContractEditor />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Public routes */}
            <Route path="/p/:token" element={<ProposalView />} />
            <Route path="/c/:token" element={<ContractSigning />} />
            <Route path="/proposal/:id/success" element={<AcceptanceSuccess />} />
          </Routes>
        </Suspense>
        <Analytics />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
