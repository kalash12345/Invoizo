import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import BookKeeping from './pages/BookKeeping';
import CustomerMaster from './pages/CustomerMaster';
import SupplierMaster from './pages/SupplierMaster';
import ProductMaster from './pages/ProductMaster';
import BillSummary from './pages/BillSummary';
import SalesBilling from './pages/SalesBilling';
import PurchaseBilling from './pages/PurchaseBilling';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import LedgerBalance from './pages/LedgerBalance';
import CashLedger from './pages/CashLedger';
import CFO from './pages/CFO';
import GroupMaster from './pages/GroupMaster';
import AccountDetails from './pages/AccountDetails';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? <Navigate to="/dashboard" /> : children;
};

const App = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        <Route element={
          <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Header />
              <main className="p-6 mt-16 bg-gray-50 min-h-[calc(100vh-4rem)]">
                <Outlet />
              </main>
            </div>
          </div>
        }>
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/inventory" element={
                <PrivateRoute>
                  <Inventory />
                </PrivateRoute>
              } />
              <Route path="/reports" element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } />
              <Route path="/book-keeping" element={
                <PrivateRoute>
                  <BookKeeping />
                </PrivateRoute>
              } />
              <Route path="/customer-master" element={
                <PrivateRoute>
                  <CustomerMaster />
                </PrivateRoute>
              } />
              <Route path="/group-master" element={
                <PrivateRoute>
                  <GroupMaster />
                </PrivateRoute>
              } />
              <Route path="/supplier-master" element={
                <PrivateRoute>
                  <SupplierMaster />
                </PrivateRoute>
              } />
              <Route path="/purchase-billing" element={
                <PrivateRoute>
                  <PurchaseBilling />
                </PrivateRoute>
              } />
              <Route path="/product-master" element={
                <PrivateRoute>
                  <ProductMaster />
                </PrivateRoute>
              } />
              <Route path="/sales-billing" element={
                <PrivateRoute>
                  <SalesBilling />
                </PrivateRoute>
              } />
              <Route path="/catalog" element={
                <PrivateRoute>
                  <Catalog />
                </PrivateRoute>
              } />
              <Route path="/ledger-balance" element={
                <PrivateRoute>
                  <LedgerBalance />
                </PrivateRoute>
              } />
              <Route path="/cash-ledger" element={
                <PrivateRoute>
                  <CashLedger />
                </PrivateRoute>
              } />
              <Route path="/account/:code" element={
                <PrivateRoute>
                  <AccountDetails />
                </PrivateRoute>
              } />
              <Route path="/cfo" element={
                <PrivateRoute>
                  <CFO />
                </PrivateRoute>
              } />
        </Route>
        
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;