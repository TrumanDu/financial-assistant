/* eslint-disable react/function-component-definition */
import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import AppLayout from './AppLayout';
import Dashboard from './Dashboard';
import Investment from './Investment';
import InvestmentRecord from './InvestmentRecord';
import RecordAssets from './RecordAssets';
import BillRecord from './BillRecord';
import ProductDiscovery from './ProductDiscovery';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="investment" element={<Investment />} />
          <Route path="investment_record" element={<InvestmentRecord />} />
          <Route path="record_assets" element={<RecordAssets />} />
          <Route path="bill_record" element={<BillRecord />} />
          <Route path="product_discovery" element={<ProductDiscovery />} />
        </Route>
      </Routes>
    </Router>
  );
}
