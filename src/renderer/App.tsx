/* eslint-disable react/function-component-definition */
import React, { Suspense, lazy } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import AppLayout from './AppLayout';

// 懒加载组件
const Dashboard = lazy(() => import('./Dashboard'));
const InvestmentRecord = lazy(() => import('./InvestmentRecord'));
const RecordAssets = lazy(() => import('./RecordAssets'));
const BillRecord = lazy(() => import('./BillRecord'));
const ProductDiscovery = lazy(() => import('./ProductDiscovery'));

// 加载中组件
const Loading = () => <div>加载中...</div>;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="investment_record"
            element={
              <Suspense fallback={<Loading />}>
                <InvestmentRecord />
              </Suspense>
            }
          />
          <Route
            path="record_assets"
            element={
              <Suspense fallback={<Loading />}>
                <RecordAssets />
              </Suspense>
            }
          />
          <Route
            path="bill_record"
            element={
              <Suspense fallback={<Loading />}>
                <BillRecord />
              </Suspense>
            }
          />
          <Route
            path="product_discovery"
            element={
              <Suspense fallback={<Loading />}>
                <ProductDiscovery />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
