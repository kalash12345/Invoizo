import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, Calendar } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BillSummary = () => {
  const navigate = useNavigate();
  const [billType, setBillType] = useState('sales');
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    loadBills();
  }, [billType]);

  const loadBills = () => {
    const storedBills = JSON.parse(
      localStorage.getItem(billType === 'sales' ? 'salesBills' : 'purchaseBills') || '[]'
    );
    setBills(storedBills);
  };

  const handleEdit = (bill) => {
    // Store the bill to edit in localStorage
    localStorage.setItem('editingBill', JSON.stringify(bill));
    // Navigate to the appropriate billing page
    navigate(billType === 'sales' ? '/sales-billing' : '/purchase-billing');
  };

  const handleDelete = (billId) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      const updatedBills = bills.filter(bill => bill.id !== billId);
      localStorage.setItem(
        billType === 'sales' ? 'salesBills' : 'purchaseBills',
        JSON.stringify(updatedBills)
      );
      loadBills();
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = (
      (bill.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (billType === 'sales' ? 
        bill.custName?.toLowerCase().includes(searchTerm.toLowerCase()) :
        bill.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const matchesDateRange = (!startDate || !endDate) ? true :
      new Date(bill.date) >= startDate && new Date(bill.date) <= endDate;

    return matchesSearch && matchesDateRange;
  });

  const calculateTotal = (bill) => {
    if (!bill.items) {
      return parseFloat(bill.total) || 0;
    }
    return bill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) +
      (parseFloat(bill.carton) || 0) +
      (parseFloat(bill.freight) || 0) +
      (parseFloat(bill.tax) || 0);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bill Summary</h1>
        <div className="flex gap-4">
          <select
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="sales">Sales Bills</option>
            <option value="purchase">Purchase Bills</option>
          </select>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            className="border rounded-lg px-4 py-2"
            placeholderText="Select date range"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {billType === 'sales' ? 'Customer' : 'Supplier'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBills.map((bill, index) => (
                <tr key={bill.id || `bill-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {new Date(bill.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{bill.invoiceNo}</td>
                  <td className="px-6 py-4">
                    {billType === 'sales' ? bill.custName : bill.supplierName}
                  </td>
                  <td className="px-6 py-4 text-right">
                    ₹{calculateTotal(bill).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(bill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillSummary;