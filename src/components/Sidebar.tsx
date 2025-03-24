import React from 'react';
import { Home, Package, BarChart, Settings, ChevronDown, Folder, Brain, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const [isMasterOpen, setIsMasterOpen] = React.useState(false);
  const [isBillingOpen, setIsBillingOpen] = React.useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = React.useState(false);

  const toggleMaster = () => {
    setIsMasterOpen(!isMasterOpen);
  };

  const toggleBilling = () => {
    setIsBillingOpen(!isBillingOpen);
  };

  const toggleLedger = () => {
    setIsLedgerOpen(!isLedgerOpen);
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: BarChart, label: 'Reports', path: '/reports' },
    { icon: Folder, label: 'Catalog', path: '/catalog' },
    { icon: Folder, label: 'Book Keeping', path: '/book-keeping' },
    { icon: Brain, label: 'AI CFO', path: '/cfo' },
  ];

  return (
    <div className="w-64 h-screen glass-card fixed left-0 top-0 border-r border-gray-200/50 flex flex-col">
      <div className="p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-8">
          Invoizo
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <div>
            <button
              className="flex items-center w-full p-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              onClick={toggleMaster}
            >
              <ChevronDown className={`w-5 h-5 mr-3 transition-transform ${isMasterOpen ? 'rotate-180' : ''}`} />
              <span className="font-medium">Master</span>
            </button>
            {isMasterOpen && (
              <div className="pl-8 space-y-2">
                <Link to="/customer-master" className="block text-gray-600 hover:text-blue-600">Customer Master</Link>
                <Link to="/product-master" className="block text-gray-600 hover:text-blue-600">Product Master</Link>
                <Link to="/group-master" className="block text-gray-600 hover:text-blue-600">Group Master</Link>
                <Link to="/supplier-master" className="block text-gray-600 hover:text-blue-600">Supplier Master</Link>
              </div>
            )}
          </div>
          <div>
            <button
              className="flex items-center w-full p-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              onClick={toggleBilling}
            >
              <ChevronDown className={`w-5 h-5 mr-3 transition-transform ${isBillingOpen ? 'rotate-180' : ''}`} />
              <span className="font-medium">Billing</span>
            </button>
            {isBillingOpen && (
              <div className="pl-8 space-y-2">
                <Link to="/sales-billing" className="block text-gray-600 hover:text-blue-600">Sales Billing</Link>
                <Link to="/purchase-billing" className="block text-gray-600 hover:text-blue-600">Purchase Billing</Link>
              </div>
            )}
          </div>
          <div>
            <button
              className="flex items-center w-full p-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              onClick={toggleLedger}
            >
              <ChevronDown className={`w-5 h-5 mr-3 transition-transform ${isLedgerOpen ? 'rotate-180' : ''}`} />
              <span className="font-medium">Ledgers</span>
            </button>
            {isLedgerOpen && (
              <div className="pl-8 space-y-2">
                <Link to="/cash-ledger" className="block text-gray-600 hover:text-blue-600">Cash Ledger</Link>
                <Link to="/ledger-balance" className="block text-gray-600 hover:text-blue-600">Ledger Balance</Link>
              </div>
            )}
          </div>
          {/* Settings Moved to Last */}
          <Link
            to="/settings"
            className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
              location.pathname === '/settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;