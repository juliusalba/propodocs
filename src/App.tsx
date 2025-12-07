import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Proposals } from './pages/Proposals';
import { ProposalEditor } from './pages/ProposalEditor';
import { ProposalView } from './pages/ProposalView';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { AcceptanceSuccess } from './pages/AcceptanceSuccess';
import { CalculatorBuilder } from './pages/CalculatorBuilder';
import { CalculatorsList } from './pages/CalculatorsList';
import { MarineCalculator } from './pages/MarineCalculator';
import MarketingCalculator from './pages/MarketingCalculator';
import { CustomCalculatorUsage } from './pages/CustomCalculatorUsage';
import { Templates } from './pages/Templates';
import InvoicesPage from './pages/Invoices';
import { InvoiceEditor } from './pages/InvoiceEditor';
import ContractsPage from './pages/Contracts';
import { ContractEditor } from './pages/ContractEditor';
import { ContractSigning } from './pages/ContractSigning';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from 'antd';
import { Analytics } from '@vercel/analytics/react';

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

          <Route path="/calculator/marine" element={
            <ProtectedRoute>
              <MarineCalculator />
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
        <Analytics />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
