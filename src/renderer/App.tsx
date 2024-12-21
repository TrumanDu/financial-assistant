/* eslint-disable react/function-component-definition */
import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import AppLayout from './AppLayout';
import Dashboard from './Dashboard';
import SavingsRecord from './SavingsRecord';
import Investment from './Investment';
import InvestmentRecord from './InvestmentRecord';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="savings_record" element={<SavingsRecord />} />
          <Route path="investment" element={<Investment />} />
          <Route path="investment_record" element={<InvestmentRecord />} />
        </Route>
      </Routes>
    </Router>
  );
}
