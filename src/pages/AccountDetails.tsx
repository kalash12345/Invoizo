import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Transaction {
  date: string;
  narration: string;
  credit: number;
  debit: number;
  balance: number;
  reference?: string;
}

const AccountDetails = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [actualCode, setActualCode] = useState<string>('');
  const [account, setAccount] = useState<any>(null);
  const [accountType, setAccountType] = useState<'customer' | 'supplier' | 'cash' | 'bank' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    if (!urlCode) return;
    
    let extractedCode = '';
    let type = null;
    
    // Extract the actual code from the URL parameter
    if (urlCode.startsWith('CUST-')) {
      extractedCode = urlCode.replace('CUST-', '');
      type = 'customer';
    } else if (urlCode.startsWith('SUPP-')) {
      extractedCode = urlCode.replace('SUPP-', '');
      type = 'supplier';
    } else if (urlCode.startsWith('CASH-')) {
      extractedCode = urlCode.replace('CASH-', '');
      type = 'cash';
    } else if (urlCode.startsWith('BANK-')) {
      extractedCode = urlCode.replace('BANK-', '');
      type = 'bank';
    } else {
      extractedCode = urlCode;
      type = determineAccountType(urlCode);
    }
    
    setActualCode(extractedCode);
    setAccountType(type);
  }, [urlCode]);

  const determineAccountType = (code: string) => {
    if (!code) return null;

    // Check if it's a supplier
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    if (suppliers.some(s => s.id === code)) {
      return 'supplier';
    }
    
    // Check if it's a customer
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    if (customers.some(c => c.id === code)) {
      return 'customer';
    }

    // Check if it's a cash or bank account
    if (code.toLowerCase().startsWith('cash')) {
      return 'cash';
    } else if (code.toLowerCase().startsWith('bank')) {
      return 'bank';
    }
    
    return null;
  };

  const getAccountPrefix = () => {
    switch (accountType) {
      case 'customer': return 'CUST-';
      case 'supplier': return 'SUPP-';
      case 'cash': return 'CASH-';
      case 'bank': return 'BANK-';
      default: return '';
    }
  };

  useEffect(() => {
    if (accountType) {
      loadAccountDetails(actualCode);
    }
  }, [actualCode, dateRange, accountType]);

  const loadAccountDetails = (code: string) => {
    const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
    const purchaseBills = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
    const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');

    let accountTransactions: Transaction[] = [];
    let accountName = '';

    const displayCode = `${getAccountPrefix()}${code}`;

    if (accountType === 'customer') {
      // For customers: Sales are debits, payments are credits
      const customer = JSON.parse(localStorage.getItem('customers') || '[]')
        .find(c => c.id === code);
      accountName = customer?.name || '';

      // Add sales bills (debits)
      salesBills
        .filter(bill => bill.custCode === code && bill.paymentType === 'credit')  // Only include credit bills
        .forEach(bill => {
          accountTransactions.push({
            date: bill.date,
            narration: `Sales Bill #${bill.invoiceNo}`,
            credit: 0,
            debit: parseFloat(bill.total) || 0,
            balance: 0,
            reference: bill.invoiceNo
          });
        });

      // Add payments (credits)
      bookEntries
        .filter(entry => entry.custCode === code)
        .forEach(entry => {
          accountTransactions.push({
            date: entry.date,
            narration: entry.narration,
            credit: parseFloat(entry.credit) || 0,
            debit: 0,
            balance: 0
          });
        });
    } else if (accountType === 'supplier') {
      // For suppliers: Purchases are credits, payments are debits
      const supplier = JSON.parse(localStorage.getItem('suppliers') || '[]')
        .find(s => s.id === code);
      accountName = supplier?.name || '';

      // Add purchase bills (credits)
      purchaseBills
        .filter(bill => bill.supplierCode === code)
        .forEach(bill => {
          accountTransactions.push({
            date: bill.date,
            narration: `Purchase Bill #${bill.invoiceNo}`,
            credit: parseFloat(bill.total) || 0,
            debit: 0,
            balance: 0,
            reference: bill.invoiceNo
          });
        });

      // Add payments (debits)
      bookEntries
        .filter(entry => entry.supplierCode === code)
        .forEach(entry => {
          accountTransactions.push({
            date: entry.date,
            narration: entry.narration,
            credit: 0,
            debit: parseFloat(entry.debit) || 0,
            balance: 0
          });
        });
    } else if (accountType === 'cash' || accountType === 'bank') {
      // For cash/bank accounts: show all entries
      const matchingEntries = bookEntries.filter(entry => entry.acCode === code);
      if (matchingEntries.length > 0) {
        accountName = matchingEntries[0].acHead;
      }

      matchingEntries.forEach(entry => {
        accountTransactions.push({
          date: entry.date,
          narration: entry.narration,
          credit: parseFloat(entry.credit) || 0,
          debit: parseFloat(entry.debit) || 0,
          balance: 0
        });
      });
    }

    // Sort transactions by date
    accountTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter by date range if set
    if (startDate && endDate) {
      accountTransactions = accountTransactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= startDate && txnDate <= endDate;
      });
    }

    // Calculate running balance
    let runningBalance = 0;
    accountTransactions = accountTransactions.map(txn => {
      if (accountType === 'supplier') {
        // For suppliers: credits increase liability, debits decrease it
        runningBalance = runningBalance + txn.credit - txn.debit;
      } else {
        // For customers and cash/bank: debits increase, credits decrease
        runningBalance = runningBalance + txn.debit - txn.credit;
      }
      return { ...txn, balance: runningBalance };
    });

    setAccount(prev => ({
      ...prev,
      code: displayCode,
      name: accountName,
      type: accountType || 'unknown'
    }));
    setTransactions(accountTransactions);
  };

  if (!account) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ledger-balance')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-gray-500">Account Code: {account.code}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
            <Calendar className="w-5 h-5 text-gray-500" />
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              className="border-none bg-transparent focus:outline-none text-sm"
              placeholderText="Select date range"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Narration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((txn, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{txn.narration}</td>
                  <td className="px-6 py-4 text-right">
                    {txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {txn.debit > 0 ? `₹${txn.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    <span className={txn.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(txn.balance).toLocaleString()}
                      {txn.balance >= 0 ? ' Dr' : ' Cr'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right">Total:</td>
                <td className="px-6 py-4 text-right">
                  ₹{transactions.reduce((sum, txn) => sum + txn.credit, 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  ₹{transactions.reduce((sum, txn) => sum + txn.debit, 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={transactions[transactions.length - 1]?.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{Math.abs(transactions[transactions.length - 1]?.balance || 0).toLocaleString()}
                    {transactions[transactions.length - 1]?.balance >= 0 ? ' Dr' : ' Cr'}
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

export default AccountDetails;