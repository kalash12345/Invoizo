import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, Calendar, ChevronDown } from 'lucide-react';

interface Account {
  code: string;
  name: string;
  type: 'customer' | 'supplier' | 'cash' | 'bank';
  credit: number;
  debit: number;
  balance: number;
}

const LedgerBalance: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [showDatePresets, setShowDatePresets] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    
    // Set default to current financial year
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Financial year is from April to March
    const fyStart = currentMonth >= 4 
      ? `${currentYear}-04-01`
      : `${currentYear - 1}-04-01`;
    
    const fyEnd = currentMonth >= 4
      ? `${currentYear + 1}-03-31`
      : `${currentYear}-03-31`;

    setPeriodStart(fyStart);
    setPeriodEnd(fyEnd);
    
    loadAccounts();
  }, [periodStart, periodEnd]);

  const setDateRange = (preset: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    switch (preset) {
      case 'thisMonth': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setPeriodStart(start.toISOString().split('T')[0]);
        setPeriodEnd(end.toISOString().split('T')[0]);
        break;
      }
      case 'lastMonth': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        setPeriodStart(start.toISOString().split('T')[0]);
        setPeriodEnd(end.toISOString().split('T')[0]);
        break;
      }
      case 'thisFinancialYear': {
        const fyStart = currentMonth >= 4 
          ? `${currentYear}-04-01`
          : `${currentYear - 1}-04-01`;
        const fyEnd = currentMonth >= 4
          ? `${currentYear + 1}-03-31`
          : `${currentYear}-03-31`;
        setPeriodStart(fyStart);
        setPeriodEnd(fyEnd);
        break;
      }
      case 'lastFinancialYear': {
        const fyStart = currentMonth >= 4 
          ? `${currentYear - 1}-04-01`
          : `${currentYear - 2}-04-01`;
        const fyEnd = currentMonth >= 4
          ? `${currentYear}-03-31`
          : `${currentYear - 1}-03-31`;
        setPeriodStart(fyStart);
        setPeriodEnd(fyEnd);
        break;
      }
    }
    setShowDatePresets(false);
  };

  const loadAccounts = () => {
    try {
      // Load all data sources
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
      const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
      const purchaseBills = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
      const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');
      const accountList: Account[] = [];

      // Process customer accounts
      customers.forEach(customer => {
        const customerBills = salesBills
          .filter(bill => 
            bill.custCode === customer.id && 
            bill.paymentType === 'credit' &&  // Only include credit bills
            new Date(bill.date) >= new Date(periodStart) &&
            new Date(bill.date) <= new Date(periodEnd)
          )
          .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);

        const customerPayments = bookEntries
          .filter(entry => 
            entry.custCode === customer.id &&
            new Date(entry.date) >= new Date(periodStart) &&
            new Date(entry.date) <= new Date(periodEnd)
          )
          .reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);

        if (customerBills > 0 || customerPayments > 0) {
          accountList.push({
            code: customer.id,
            name: customer.name,
            type: 'customer',
            credit: customerPayments,
            debit: customerBills,
            balance: customerBills - customerPayments
          });
        }
      });

      // Process supplier accounts
      suppliers.forEach(supplier => {
        const supplierBills = purchaseBills
          .filter(bill => 
            bill.supplierCode === supplier.id &&
            new Date(bill.date) >= new Date(periodStart) &&
            new Date(bill.date) <= new Date(periodEnd)
          )
          .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);

        const supplierPayments = bookEntries
          .filter(entry => 
            entry.supplierCode === supplier.id &&
            new Date(entry.date) >= new Date(periodStart) &&
            new Date(entry.date) <= new Date(periodEnd)
          )
          .reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);

        if (supplierBills > 0 || supplierPayments > 0) {
          accountList.push({
            code: supplier.id,
            name: supplier.name,
            type: 'supplier',
            credit: supplierBills,
            debit: supplierPayments,
            balance: supplierBills - supplierPayments
          });
        }
      });

      // Process cash and bank accounts
      const cashAndBankEntries = bookEntries.filter(entry => 
        (entry.acCode.toLowerCase().startsWith('cash') || entry.acCode.toLowerCase().startsWith('bank')) &&
        new Date(entry.date) >= new Date(periodStart) &&
        new Date(entry.date) <= new Date(periodEnd)
      );

      // Group by account code
      const accountGroups = cashAndBankEntries.reduce((groups, entry) => {
        if (!groups[entry.acCode]) {
          groups[entry.acCode] = {
            code: entry.acCode,
            name: entry.acHead,
            type: entry.acCode.toLowerCase().startsWith('cash') ? 'cash' : 'bank',
            credit: 0,
            debit: 0
          };
        }
        groups[entry.acCode].credit += parseFloat(entry.credit) || 0;
        groups[entry.acCode].debit += parseFloat(entry.debit) || 0;
        return groups;
      }, {});

      // Add cash and bank accounts to the list
      Object.values(accountGroups).forEach(account => {
        if (account.credit > 0 || account.debit > 0) {
          accountList.push({
            ...account,
            balance: account.debit - account.credit
          });
        }
      });

      setAccounts(accountList);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const totals = useMemo(() => {
    return filteredAccounts.reduce((acc, account) => ({
      credit: acc.credit + account.credit,
      debit: acc.debit + account.debit,
      balance: acc.balance + account.balance
    }), { credit: 0, debit: 0, balance: 0 });
  }, [filteredAccounts]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ledger Balance</h1>
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDatePresets(!showDatePresets)}
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Date Range
              <ChevronDown className="w-4 h-4" />
            </button>
            {showDatePresets && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <div className="py-1">
                  <button
                    onClick={() => setDateRange('thisMonth')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDateRange('lastMonth')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setDateRange('thisFinancialYear')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    This Financial Year
                  </button>
                  <button
                    onClick={() => setDateRange('lastFinancialYear')}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Last Financial Year
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="border rounded px-3 py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="border rounded px-3 py-1.5"
              />
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">A/c Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">A/c Head</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.map((account, index) => (
                <tr key={`${account.type}-${account.code}-${index}`} className="hover:bg-gray-50">
                  <td 
                    className="px-6 py-4 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/account/${
                      account.type === 'customer' ? `CUST-${account.code}` :
                      account.type === 'supplier' ? `SUPP-${account.code}` :
                      account.type === 'cash' ? `CASH-${account.code}` :
                      account.type === 'bank' ? `BANK-${account.code}` :
                      account.code}`)}
                  >
                    {account.type === 'customer' ? `CUST-${account.code}` :
                     account.type === 'supplier' ? `SUPP-${account.code}` :
                     account.type === 'cash' ? `CASH-${account.code}` :
                     account.type === 'bank' ? `BANK-${account.code}` :
                     account.code}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/account/${
                      account.type === 'customer' ? `CUST-${account.code}` :
                      account.type === 'supplier' ? `SUPP-${account.code}` :
                      account.type === 'cash' ? `CASH-${account.code}` :
                      account.type === 'bank' ? `BANK-${account.code}` :
                      account.code}`)}
                  >
                    {account.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.type === 'customer'
                        ? 'bg-blue-100 text-blue-700'
                        : account.type === 'supplier'
                        ? 'bg-purple-100 text-purple-700'
                        : account.type === 'cash'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">₹{account.credit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">₹{account.debit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(account.balance).toLocaleString()}{' '}
                      {account.type === 'supplier' 
                        ? (account.balance >= 0 ? 'Cr' : 'Dr')
                        : (account.balance >= 0 ? 'Dr' : 'Cr')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right">Total:</td>
                <td className="px-6 py-4 text-right">₹{totals.credit.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">₹{totals.debit.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <span className={totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{Math.abs(totals.balance).toLocaleString()}
                    {totals.balance >= 0 ? ' Dr' : ' Cr'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerBalance;