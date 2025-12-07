import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { Landing } from './pages/Landing';
import MarketingCalculator from './pages/MarketingCalculator';
import { MarineCalculator } from './pages/MarineCalculator';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Proposals } from './pages/Proposals';
import { ProposalEditor } from './pages/ProposalEditor';
import { ProposalView } from './pages/ProposalView';
import { AcceptanceSuccess } from './pages/AcceptanceSuccess';
import { Settings } from './pages/Settings';
import { CRM } from './pages/CRM';
import { CalculatorsList } from './pages/CalculatorsList';
import { CalculatorBuilder } from './pages/CalculatorBuilder';
import { CustomCalculatorUsage } from './pages/CustomCalculatorUsage';
import { Templates } from './pages/Templates';
import InvoicesPage from './pages/Invoices';
import { InvoiceEditor } from './pages/InvoiceEditor';
import ContractsPage from './pages/Contracts';
import { ContractEditor } from './pages/ContractEditor';
import { ContractSigning } from './pages/ContractSigning';
import { NotFound } from './pages/NotFound';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/marketing" element={<MarketingCalculator />} />
              <Route path="/marine" element={<MarineCalculator />} />
              <Route path="/calculator/vmg" element={<MarketingCalculator />} />
              <Route path="/calculator/marketing" element={<MarketingCalculator />} />
              <Route path="/calculator/marine" element={<MarineCalculator />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/proposals/new" element={<ProposalEditor />} />
              <Route path="/proposals/:id/edit" element={<ProposalEditor />} />
              <Route path="/share/:token" element={<ProposalView />} />
              <Route path="/proposal-accepted/:token" element={<AcceptanceSuccess />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/clients" element={<CRM />} />
              <Route path="/calculators" element={<CalculatorsList />} />
              <Route path="/calculators/new" element={<CalculatorBuilder />} />
              <Route path="/calculators/:id" element={<CalculatorBuilder />} />
              <Route path="/calculator/custom/:id" element={<CustomCalculatorUsage />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/new" element={<Templates />} />
              <Route path="/templates/:id" element={<Templates />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/new" element={<InvoiceEditor />} />
              <Route path="/invoices/:id" element={<InvoiceEditor />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/new" element={<ContractEditor />} />
              <Route path="/contracts/:id" element={<ContractEditor />} />
              <Route path="/c/:token" element={<ContractSigning />} />
              {/* Catch-all 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

