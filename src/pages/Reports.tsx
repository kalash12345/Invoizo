import React, { useState, useEffect } from 'react';
import { Calendar, Download, ChevronDown, Search, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [billType, setBillType] = useState('sales');
  const [bills, setBills] = useState([]);
  const [purchaseMetrics, setPurchaseMetrics] = useState({
    totalPurchases: 0,
    averageOrderValue: 0,
    topSuppliers: [],
    purchasesByCategory: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    creditSales: 0,
    cashSales: 0,
    averageOrderValue: 0,
    topProducts: [],
    salesByCategory: {}
  });

  useEffect(() => {
    loadBills();
  }, [billType]);


  useEffect(() => {
    if (billType === 'sales') {
      calculateSalesMetrics();
    } else {
      calculatePurchaseMetrics();
    }
  }, [bills]);

  const loadBills = () => {
    const storedBills = JSON.parse(
      localStorage.getItem(billType === 'sales' ? 'salesBills' : 'purchaseBills') || '[]'
    );
    setBills(storedBills);
  };

  const calculateSalesMetrics = () => {
    if (!bills || bills.length === 0) {
      setSalesMetrics({
        totalSales: 0,
        creditSales: 0,
        cashSales: 0,
        averageOrderValue: 0,
        topProducts: [],
        salesByCategory: {}
      });
      return;
    }

    const totalSales = bills.reduce((sum, bill) => sum + calculateTotal(bill), 0);
    const creditSales = bills
      .filter(bill => bill.paymentType === 'credit')
      .reduce((sum, bill) => sum + calculateTotal(bill), 0);
    const cashSales = totalSales - creditSales;
    const averageOrderValue = totalSales / (bills.length || 1);

    // Calculate top products
    const productSales = {};
    bills.forEach(bill => {
      bill.items?.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += parseFloat(item.qty) || 0;
        productSales[item.name].revenue += parseFloat(item.amount) || 0;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    setSalesMetrics({
      totalSales,
      creditSales,
      cashSales,
      averageOrderValue,
      topProducts,
      salesByCategory: productSales
    });
  };

  const calculatePurchaseMetrics = () => {
    const totalPurchases = bills.reduce((sum, bill) => sum + calculateTotal(bill), 0);
    const averageOrderValue = totalPurchases / (bills.length || 1);

    // Calculate top suppliers
    const supplierPurchases = {};
    bills.forEach(bill => {
      const supplierName = bill.supplierName;
      if (!supplierPurchases[supplierName]) {
        supplierPurchases[supplierName] = { count: 0, total: 0 };
      }
      supplierPurchases[supplierName].count += 1;
      supplierPurchases[supplierName].total += calculateTotal(bill);
    });

    const topSuppliers = Object.entries(supplierPurchases)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    setPurchaseMetrics({
      totalPurchases,
      averageOrderValue,
      topSuppliers,
      purchasesByCategory: supplierPurchases
    });
  };

  const calculateTotal = (bill) => {
    if (!bill.items) {
      return parseFloat(bill.total) || 0;
    }
    return bill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) +
      (parseFloat(bill.carton) || 0) +
      (parseFloat(bill.freight) || 0) +
      (parseFloat(bill.tax) || 0);
  };

  const handleEdit = (bill) => {
    localStorage.setItem('editingBill', JSON.stringify(bill));
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-3">
          <select
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="sales">Sales Bills</option>
            <option value="purchase">Purchase Bills</option>
          </select>
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

          {/* Dropdown Menu for Reports */}
          <div className="relative">
            <button
              className="bg-white px-4 py-2 rounded-lg border flex items-center gap-2"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Report Options <ChevronDown className="w-5 h-5" />
            </button>
            {isDropdownOpen && (
              <ul className="absolute mt-2 w-48 bg-white border rounded-lg shadow-md">
                {[
                  'Daybook',
                  'Ledger',
                  'Trial Balance',
                  'Balance Sheet',
                  'Trading Profit & Loss',
                ].map((item, index) => (
                  <li
                    key={`report-option-${index}`}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {billType === 'sales' ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <h2 className="text-lg font-semibold mb-6">Sales Overview</h2>
              <div className="h-64 mb-4">
                <Line
                  data={{
                    labels: bills.map(bill => new Date(bill.date).toLocaleDateString()),
                    datasets: [{
                      label: 'Sales Amount',
                      data: bills.map(bill => calculateTotal(bill)),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `₹${context.parsed.y.toLocaleString()}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${value.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Total Sales</div>
                  <div className="text-lg font-semibold">
                    ₹{salesMetrics.totalSales.toLocaleString()}
                    <div className="text-xs text-gray-500 mt-1">
                      Cash: ₹{salesMetrics.cashSales.toLocaleString()}
                      <br />
                      Credit: ₹{salesMetrics.creditSales.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Average Order Value</div>
                  <div className="text-lg font-semibold">₹{salesMetrics.averageOrderValue.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Total Orders</div>
                  <div className="text-lg font-semibold">{bills.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <h2 className="text-lg font-semibold mb-4">Top Products</h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: salesMetrics.topProducts.map(p => p.name),
                    datasets: [{
                      label: 'Revenue',
                      data: salesMetrics.topProducts.map(p => p.revenue),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `₹${context.parsed.y.toLocaleString()}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${value.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <h2 className="text-lg font-semibold mb-4">Purchase Overview</h2>
              <div className="h-64 mb-4">
                <Line
                  data={{
                    labels: bills.map(bill => new Date(bill.date).toLocaleDateString()),
                    datasets: [{
                      label: 'Purchase Amount',
                      data: bills.map(bill => calculateTotal(bill)),
                      borderColor: 'rgb(147, 51, 234)',
                      backgroundColor: 'rgba(147, 51, 234, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `₹${context.parsed.y.toLocaleString()}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${value.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Total Purchases</div>
                  <div className="text-lg font-semibold">₹{purchaseMetrics.totalPurchases.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Average Order</div>
                  <div className="text-lg font-semibold">₹{purchaseMetrics.averageOrderValue.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <h2 className="text-lg font-semibold mb-4">Top Suppliers</h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: purchaseMetrics.topSuppliers.map(s => s.name),
                    datasets: [{
                      label: 'Purchase Amount',
                      data: purchaseMetrics.topSuppliers.map(s => s.total),
                      backgroundColor: 'rgba(147, 51, 234, 0.8)',
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `₹${context.parsed.y.toLocaleString()}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${value.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {billType === 'sales' ? 'Customer' : 'Supplier'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBills.length === 0 ? (
                <tr key="no-bills">
                  <td colSpan={5} className="text-center py-8 border text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id || `bill-${bill.invoiceNo}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {new Date(bill.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {billType === 'sales' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bill.paymentType === 'credit' 
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {bill.paymentType === 'credit' ? 'Credit' : 'Cash'}
                        </span>
                      )}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;