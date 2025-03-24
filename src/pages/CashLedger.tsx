import React, { useState, useRef, useEffect } from "react";
import { Printer, Download, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';

interface BookEntry {
  date: string;
  acCode: string;
  acHead: string;
  narration: string;
  credit: number;
  debit: number;
}

interface Transaction {
  date: string;
  openingBalance: number;
  credit: number;
  debit: number;
  closingBalance: number;
}

const CashLedger = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDbBalOnly, setShowDbBalOnly] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  
  const displayReportRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent, date: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // Navigate to BookKeeping with the selected date
      navigate('/book-keeping');
      // Use localStorage to pass the selected date to BookKeeping
      localStorage.setItem('selectedBookKeepingDate', date);
    }
  };

  const isWithinDateRange = (dateStr: string, fromDate: Date, toDate: Date) => {
    const date = new Date(dateStr);
    const from = new Date(fromDate.setHours(0, 0, 0, 0));
    const to = new Date(toDate.setHours(23, 59, 59, 999));
    return date >= from && date <= to;
  };

  const calculateDailyTransactions = (entries: BookEntry[]): Transaction[] => {
    try {
      // Get entries from both book entries and cash ledger
      const bookEntries = entries;
      const cashLedgerEntries = JSON.parse(localStorage.getItem('cashLedger') || '[]');
      
      // Combine and sort all entries
      const allEntries = [...bookEntries, ...cashLedgerEntries].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Group entries by date
      const dailyEntries = allEntries.reduce((acc, entry) => {
        const date = entry.date;
        if (!acc[date]) {
          acc[date] = {
            credit: 0,
            debit: 0
          };
        }
        acc[date].credit += Number(entry.credit) || 0;
        acc[date].debit += Number(entry.debit) || 0;
        return acc;
      }, {} as Record<string, { credit: number; debit: number }>);

      // Convert to transactions with running balance
      let runningBalance = 0;
      const transactions: Transaction[] = Object.entries(dailyEntries)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, { credit, debit }]) => {
          const openingBalance = runningBalance;
          const closingBalance = openingBalance + credit - debit;
          runningBalance = closingBalance;

          return {
            date,
            openingBalance,
            credit,
            debit,
            closingBalance
          };
        });

      return transactions;
    } catch (error) {
      console.error('Error calculating transactions:', error);
      return [];
    }
  };

  const handleDisplayReport = () => {
    const storedEntries = localStorage.getItem('bookEntries');

    if (!storedEntries) {
      setTransactions([]);
      return;
    }

    const entries: BookEntry[] = JSON.parse(storedEntries);
    const filteredEntries = entries.filter(entry => 
      isWithinDateRange(entry.date, fromDate, toDate)
    );

    const calculatedTransactions = calculateDailyTransactions(filteredEntries);
    setTransactions(calculatedTransactions);
  };

  // Load transactions when date range changes
  useEffect(() => {
    handleDisplayReport();
  }, [fromDate, toDate]);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cash Balance</h2>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <DatePicker
                selected={fromDate}
                onChange={(date: Date) => setFromDate(date)}
                className="border p-2 rounded w-32"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <DatePicker
                selected={toDate}
                onChange={(date: Date) => setToDate(date)}
                className="border p-2 rounded w-32"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowDbBalOnly(!showDbBalOnly)}
          className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
        >
          Show Db Bal Only
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-right">Opening Balance</th>
              <th className="border p-2 text-right">Credit</th>
              <th className="border p-2 text-right">Debit</th>
              <th className="border p-2 text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 border text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              transactions.map((txn, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${selectedRow === index ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedRow(index)}
                  onKeyDown={(e) => handleKeyDown(e, txn.date)}
                  tabIndex={0}
                >
                  <td className="border p-2">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="border p-2 text-right">₹{txn.openingBalance.toLocaleString()}</td>
                  <td className="border p-2 text-right">₹{txn.credit.toLocaleString()}</td>
                  <td className="border p-2 text-right">₹{txn.debit.toLocaleString()}</td>
                  <td className="border p-2 text-right font-medium">₹{txn.closingBalance.toLocaleString()}</td>
                </tr>
              ))
            )}
            {transactions.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td className="border p-2">Total</td>
                <td className="border p-2 text-right">-</td>
                <td className="border p-2 text-right">
                  ₹{transactions.reduce((sum, txn) => sum + txn.credit, 0).toLocaleString()}
                </td>
                <td className="border p-2 text-right">
                  ₹{transactions.reduce((sum, txn) => sum + txn.debit, 0).toLocaleString()}
                </td>
                <td className="border p-2 text-right">
                  ₹{transactions[transactions.length - 1].closingBalance.toLocaleString()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          ref={displayReportRef}
          onClick={handleDisplayReport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Display Report
        </button>
        <button 
          onClick={() => navigate('/book-keeping')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Exit
        </button>
        <button className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition-colors flex items-center">
          <Printer className="mr-2" size={16} /> Print
        </button>
        <button className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition-colors flex items-center">
          <Download className="mr-2" size={16} /> Export to PDF
        </button>
      </div>
    </div>
  );
};

export default CashLedger;