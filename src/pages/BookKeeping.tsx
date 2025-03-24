import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, Calendar, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface BookEntry {
  id: string;
  slNo: number;
  date: string;
  acCode: string;
  acHead: string;
  narration: string;
  credit: number;
  debit: number;
}

const AccountEntryForm = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<BookEntry[]>([
    { id: Date.now().toString(), slNo: 1, date: selectedDate.toISOString().split('T')[0], acCode: '', acHead: '', narration: '', credit: 0, debit: 0 }
  ]);
  const [dailySummary, setDailySummary] = useState({
    openingBalance: 0,
    totalCredit: 0,
    totalDebit: 0,
    closingBalance: 0
  });
  const [showAccountSearch, setShowAccountSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const searchInputRef = useRef(null);

  // Create refs for all input fields
  const dateInputRef = useRef(null);
  const openingBalanceRef = useRef(null);
  const inputRefs = useRef([]);

  // Load entries and calculate balances on mount and date change
  useEffect(() => {
    loadEntriesForDate(selectedDate);
  }, [selectedDate]);

  const loadEntriesForDate = (date: Date) => {
    const storedEntries = localStorage.getItem('bookEntries');
    const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
    const dateStr = date.toISOString().split('T')[0];

    // Calculate cash sales for the day
    const cashSales = salesBills
      .filter(bill => bill.date === dateStr && bill.paymentType === 'cash')
      .reduce((sum, bill) => sum + parseFloat(bill.total || '0'), 0);

    if (storedEntries) {
      const allEntries = JSON.parse(storedEntries);
      // Filter out exempted sales entries for the current date
      const todayEntries = allEntries.filter(entry => 
        entry.date === dateStr && 
        !(entry.narration === 'Exempted Sales for the day' && entry.acCode === 'CASH-001')
      )
        .sort((a, b) => a.slNo - b.slNo);

      // Create initial entries array
      let initialEntries = [];
      
      // Add exempted sales entry if there are cash sales
      if (cashSales > 0) {
        initialEntries.push({
          id: `cash-sales-${Date.now()}`,
          slNo: 1,
          date: dateStr,
          acCode: 'CASH-001',
          acHead: 'Cash Account',
          narration: 'Exempted Sales for the day',
          credit: cashSales,
          debit: 0
        });
      }

      // Add existing entries or create empty entry
      if (todayEntries.length > 0) {
        initialEntries = [...initialEntries, ...todayEntries.map((entry, idx) => ({
          ...entry,
          slNo: idx + 1 + (cashSales > 0 ? 1 : 0)
        }))];
      }

      // If no entries, add an empty one
      if (initialEntries.length === 0) {
        initialEntries.push({ 
          id: Date.now().toString(),
          slNo: 1, 
          date: dateStr, 
          acCode: '', 
          acHead: '', 
          narration: '', 
          credit: 0, 
          debit: 0 
        });
      }
      
      setEntries(initialEntries);

      // Calculate opening balance
      const previousDayEntries = allEntries.filter(entry => 
        new Date(entry.date) < new Date(dateStr)
      );

      const openingBalance = previousDayEntries.reduce((balance, entry) => 
        balance + (entry.credit || 0) - (entry.debit || 0), 0
      );

      setDailySummary(prev => ({
        ...prev,
        openingBalance
      }));
    }
  };

  // Calculate daily totals and balances
  useEffect(() => {
    const calculateDailyTotals = () => {
      const totalCredit = entries.reduce((sum, entry) => sum + (parseFloat(entry.credit.toString()) || 0), 0);
      const totalDebit = entries.reduce((sum, entry) => sum + (parseFloat(entry.debit.toString()) || 0), 0);
      const closingBalance = dailySummary.openingBalance + totalCredit - totalDebit;

      setDailySummary(prev => ({
        ...prev,
        totalCredit,
        totalDebit,
        closingBalance
      }));
    };

    calculateDailyTotals();
  }, [entries, dailySummary.openingBalance]);

  const addNewRow = () => {
    const newEntries = [
      ...entries, 
      { 
        id: Date.now().toString(),
        slNo: entries.length + 1, 
        date: selectedDate.toISOString().split('T')[0], 
        acCode: '', 
        acHead: '', 
        narration: '', 
        credit: 0, 
        debit: 0 
      }
    ];
    setEntries(newEntries);
    
    setTimeout(() => {
      if (inputRefs.current[newEntries.length - 1]) {
        inputRefs.current[newEntries.length - 1][0].focus();
      }
    }, 50);
  };

  const removeRow = (indexToRemove: number) => {
    const newEntries = entries
      .filter((_, index) => index !== indexToRemove)
      .map((entry, index) => ({
        ...entry,
        slNo: index + 1
      }));
    
    // If this was the last row, add a new empty row
    if (newEntries.length === 0) {
      newEntries.push({
        id: Date.now().toString(),
        slNo: 1,
        date: selectedDate.toISOString().split('T')[0],
        acCode: '',
        acHead: '',
        narration: '',
        credit: 0,
        debit: 0
      });
    }
    
    setEntries(newEntries);
  };

  const updateEntry = (index: number, field: keyof BookEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: field === 'credit' || field === 'debit' ? parseFloat(value) || 0 : value
    };
    setEntries(newEntries);
  };

  const saveEntries = (entriesToSave = entries) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
    const storedEntries = localStorage.getItem('bookEntries');
    let allEntries = storedEntries ? JSON.parse(storedEntries) : [];

    // Calculate cash sales for the day
    const cashSales = salesBills
      .filter(bill => bill.date === dateStr && bill.paymentType === 'cash')
      .reduce((sum, bill) => sum + parseFloat(bill.total || '0'), 0);
    
    try {
      // Remove all entries for current date
      allEntries = allEntries.filter(entry => entry.date !== dateStr);

      // Validate entries
      const validEntries = entriesToSave.filter(entry => 
        entry.acCode && entry.acHead && 
        (parseFloat(entry.credit.toString()) > 0 || parseFloat(entry.debit.toString()) > 0) &&
        // Only exclude the auto-generated cash sales entry if it's in the current entries
        !(entry.narration === 'Exempted Sales for the day' && entry.acCode === 'CASH-001' && entry.credit === cashSales)
      );

      if (validEntries.length === 0) {
        // If no valid entries, just clear the entries for this date
        localStorage.setItem('bookEntries', JSON.stringify(allEntries));
        alert('All entries cleared for this date');
        return;
      }

      // Load all required data
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');

      // Add exempted sales entry if there are cash sales
      if (cashSales > 0) {
        allEntries.push({
          id: `cash-sales-${Date.now()}`,
          date: dateStr,
          acCode: 'CASH-001',
          acHead: 'Cash Account',
          narration: 'Exempted Sales for the day',
          credit: cashSales,
          debit: 0
        });
      }
      
      // Add new entries with custCode/supplierCode
      validEntries.forEach(entry => {
        // Only add customer code for credit entries from credit sales
        if (entry.acCode.startsWith('CUST-') && entry.credit > 0 && !entry.narration.includes('Exempted Sales')) {
          entry.custCode = entry.acCode.replace('CUST-', '');
        } else if (entry.acCode.startsWith('SUPP-')) {
          entry.supplierCode = entry.acCode.replace('SUPP-', '');
        }
      });

      allEntries = [...allEntries, ...validEntries];
      
      // Sort entries by date
      allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      localStorage.setItem('bookEntries', JSON.stringify(allEntries));

      // Update customer balances
      const updatedCustomers = customers.map(customer => {
        const customerEntries = allEntries.filter(entry => 
          // Only include credit entries from credit sales for customer balances
          ((entry.custCode === customer.id) || (entry.acCode === `CUST-${customer.id}`)) && 
          entry.credit > 0 &&
          !entry.narration.includes('Exempted Sales')
        );
        
        const balance = customerEntries.reduce((sum, entry) => 
          sum + (parseFloat(entry.debit) || 0) - (parseFloat(entry.credit) || 0), 0
        );
        
        return { ...customer, balance };
      });
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));

      // Update supplier balances
      const updatedSuppliers = suppliers.map(supplier => {
        const supplierEntries = allEntries.filter(entry => 
          (entry.supplierCode === supplier.id) || 
          (entry.acCode === `SUPP-${supplier.id}`)
        );
        
        const balance = supplierEntries.reduce((sum, entry) => 
          sum + (parseFloat(entry.credit) || 0) - (parseFloat(entry.debit) || 0), 0
        );
        
        return { ...supplier, balance };
      });
      localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));

      // Update cash ledger
      const cashAndBankEntries = validEntries.filter(entry => 
        entry.acCode.startsWith('CASH-') || entry.acCode.startsWith('BANK-')
      );
      
      if (cashAndBankEntries.length > 0) {
        const existingLedger = JSON.parse(localStorage.getItem('cashLedger') || '[]');
        const filteredLedger = existingLedger.filter(entry => entry.date !== dateStr);
        const updatedLedger = [...filteredLedger, ...cashAndBankEntries].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        localStorage.setItem('cashLedger', JSON.stringify(updatedLedger));
      }

      alert('Entries saved successfully');
      loadEntriesForDate(selectedDate);
    } catch (error) {
      console.error('Error saving entries:', error);
      alert('Error saving entries. Please try again.');
    }
  };

  const handleAccountSearch = (searchTerm: string) => {
    const results = [];
    
    // Search customers
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    customers.forEach(customer => {
      if (customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({
          code: `CUST-${customer.id}`,
          name: customer.name,
          type: 'customer'
        });
      }
    });

    // Search suppliers
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    suppliers.forEach(supplier => {
      if (supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({
          code: `SUPP-${supplier.id}`,
          name: supplier.name,
          type: 'supplier'
        });
      }
    });

    // Add cash and bank accounts
    if ('cash'.includes(searchTerm.toLowerCase())) {
      results.push({
        code: 'CASH-001',
        name: 'Cash Account',
        type: 'cash'
      });
    }

    if ('bank'.includes(searchTerm.toLowerCase())) {
      results.push({
        code: 'BANK-001',
        name: 'Bank Account',
        type: 'bank'
      });
    }

    return results;
  };

  const selectAccount = (account: { code: string; name: string; type: string }, index: number) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      acCode: account.code,
      acHead: account.name
    };
    setEntries(newEntries);
    setShowAccountSearch(false);
    setSearchTerm('');
    
    // Focus on the next field
    if (inputRefs.current[index]) {
      inputRefs.current[index][2].focus(); // Focus on narration field
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent, results: any[], index: number) => {
    if (e.key === 'Escape') {
      setShowAccountSearch(false);
    } else if (e.key === 'Enter' && results.length > 0) {
      selectAccount(results[0], index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldIndex: number) => {
    const totalFields = 5; // acCode, acHead, narration, credit, debit

    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If it's the account code field, show search modal
      if (fieldIndex === 0 && !entries[rowIndex].acCode) {
        setActiveItemIndex(rowIndex);
        setShowAccountSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        return;
      }
      
      // If it's the last field of the last row, add a new row
      if (rowIndex === entries.length - 1 && fieldIndex === totalFields - 1) {
        addNewRow();
        return;
      }

      // Move to next field or next row
      let nextRowIndex = rowIndex;
      let nextFieldIndex = fieldIndex + 1;

      if (nextFieldIndex >= totalFields) {
        nextRowIndex++;
        nextFieldIndex = 0;
      }

      // Ensure we don't go out of bounds
      if (nextRowIndex < entries.length && inputRefs.current[nextRowIndex]) {
        inputRefs.current[nextRowIndex][nextFieldIndex].focus();
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Daily Accounts Entry</h2>
      
      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="border rounded px-2 py-1 w-32"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="font-medium">Opening Balance:</label>
            <input 
              type="number"
              value={dailySummary.openingBalance}
              readOnly
              className="border rounded px-2 py-1 w-32 bg-gray-50"
            />
          </div>
        </div>
      </div>
      
      {/* Account Search Modal */}
      {showAccountSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Search Account</h3>
              <button onClick={() => setShowAccountSearch(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative mb-4">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full p-2 border rounded pl-10"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => handleSearchKeyDown(e, handleAccountSearch(searchTerm), activeItemIndex)}
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {handleAccountSearch(searchTerm).map((account, index) => (
                <div
                  key={account.code}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectAccount(account, activeItemIndex)}
                >
                  <div className="font-medium">{account.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Code: {account.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Sl</th>
              <th className="border p-2">A/c Code</th>
              <th className="border p-2">A/c Head</th>
              <th className="border p-2">Narration</th>
              <th className="border p-2">Credit</th>
              <th className="border p-2">Debit</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, rowIndex) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="border p-2 text-center">{entry.slNo}</td>
                {['acCode', 'acHead', 'narration', 'credit', 'debit'].map((field, fieldIndex) => (
                  <td key={field} className="border p-2">
                    <input 
                      ref={(el) => {
                        if (!inputRefs.current[rowIndex]) {
                          inputRefs.current[rowIndex] = [];
                        }
                        inputRefs.current[rowIndex][fieldIndex] = el;
                      }}
                      type={field === 'credit' || field === 'debit' ? 'number' : 'text'}
                      className="w-full border rounded px-2 py-1"
                      value={entry[field]}
                      onChange={(e) => updateEntry(rowIndex, field as keyof BookEntry, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, fieldIndex)}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    />
                  </td>
                ))}
                <td className="border p-2 text-center">
                  {entries.length > 1 && (
                    <button 
                      onClick={() => removeRow(rowIndex)}
                      className="text-red-500 hover:bg-red-100 p-2 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-100 p-3 rounded">
          <strong>Total Credit:</strong> 
          <span className="ml-2">₹{dailySummary.totalCredit.toLocaleString()}</span>
        </div>
        <div className="bg-gray-100 p-3 rounded">
          <strong>Total Debit:</strong> 
          <span className="ml-2">₹{dailySummary.totalDebit.toLocaleString()}</span>
        </div>
        <div className="bg-blue-100 p-3 rounded">
          <strong>Closing Balance:</strong> 
          <span className="ml-2">₹{dailySummary.closingBalance.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button 
          onClick={addNewRow}
          className="flex items-center bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </button>
        <div className="space-x-2">
          <button 
            onClick={() => saveEntries()}
            className="flex items-center bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </button>
          <button 
            onClick={() => navigate('/cash-ledger')}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            View Cash Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountEntryForm;