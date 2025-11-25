import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { Landing } from './pages/Landing';
import VmgCalculator from './pages/VmgCalculator';
import { MarineCalculator } from './pages/MarineCalculator';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/vmg-pricing-calculator">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vmg" element={<VmgCalculator />} />
        <Route path="/marine" element={<MarineCalculator />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
