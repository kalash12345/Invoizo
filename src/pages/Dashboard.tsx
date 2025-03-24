import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUp, AlertTriangle, Calendar } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [projectionType, setProjectionType] = useState('conservative');
  const [auditSettings] = useState<AuditSettings>(() => {
    const savedSettings = localStorage.getItem('auditSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      enabled: true,
      autoAudit: true,
      frequency: 'monthly',
      categories: {
        inventory: true,
        sales: true,
        purchases: true,
        payments: true
      },
      thresholds: {
        stockVariance: 5,
        paymentDelay: 30,
        creditLimit: 100000
      }
    };
  });

  const [auditDateRange, setAuditDateRange] = useState([
    new Date(new Date().setDate(1)), // First day of current month
    new Date()
  ]);
  const [startDate, endDate] = auditDateRange;
  const [auditMetrics, setAuditMetrics] = useState({
    inventory: {
      stockVariance: 0,
      lowStockItems: 0,
      deadStockValue: 0
    },
    purchases: {
      pendingBills: 0,
      averagePurchaseValue: 0,
      topSuppliers: 0
    },
    sales: {
      returnRate: 0,
      cancelledBills: 0,
      priceOverrides: 0
    },
    expenses: {
      monthlyExpenses: 0,
      expenseVariance: 0,
      highExpenseCategories: 0
    }
  });
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    creditSales: 0,
    overduePayments: 0,
    riskAccounts: 0,
    pendingPayments: 0,
    totalOrders: 0,
    totalCustomers: 0,
    currentYearSales: 0,
    averageOrderValue: 0,
    customerRetentionRate: 0,
    marketShare: 0
  });

  useEffect(() => {
    calculateMetrics();
    calculateAuditMetrics();

    // Set up auto audit if enabled
    if (auditSettings.enabled && auditSettings.autoAudit) {
      const lastAudit = localStorage.getItem('lastAuditDate');
      const today = new Date();
      
      if (!lastAudit) {
        // First time, perform audit and save date
        calculateAuditMetrics();
        localStorage.setItem('lastAuditDate', today.toISOString());
        return;
      }

      const lastAuditDate = new Date(lastAudit);
      let shouldAudit = false;

      switch (auditSettings.frequency) {
        case 'daily':
          shouldAudit = today.getDate() !== lastAuditDate.getDate();
          break;
        case 'weekly':
          const weekDiff = Math.floor((today.getTime() - lastAuditDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          shouldAudit = weekDiff >= 1;
          break;
        case 'monthly':
          shouldAudit = today.getMonth() !== lastAuditDate.getMonth();
          break;
      }

      if (shouldAudit) {
        calculateAuditMetrics();
        localStorage.setItem('lastAuditDate', today.toISOString());
      }
    }
  }, [selectedYear]);

  useEffect(() => {
    calculateAuditMetrics();
  }, [auditDateRange]);

  // Check for auto audit on component mount
  useEffect(() => {
    if (auditSettings.enabled && auditSettings.autoAudit) {
      const lastAudit = localStorage.getItem('lastAuditDate');
      const today = new Date();
      
      if (!lastAudit) {
        calculateAuditMetrics();
        localStorage.setItem('lastAuditDate', today.toISOString());
        return;
      }

      const lastAuditDate = new Date(lastAudit);
      let shouldAudit = false;

      switch (auditSettings.frequency) {
        case 'daily':
          shouldAudit = today.getDate() !== lastAuditDate.getDate();
          break;
        case 'weekly':
          const weekDiff = Math.floor((today.getTime() - lastAuditDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          shouldAudit = weekDiff >= 1;
          break;
        case 'monthly':
          shouldAudit = today.getMonth() !== lastAuditDate.getMonth();
          break;
      }

      if (shouldAudit) {
        calculateAuditMetrics();
        localStorage.setItem('lastAuditDate', today.toISOString());
      }
    }
  }, []);

  const calculateAuditMetrics = () => {
    try {
      // Load all data sources
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
      const purchaseBills = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
      const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');

      // Filter data by date range
      const filterByDateRange = (items) => {
        return items.filter(item => {
          const date = new Date(item.date);
          return date >= startDate && date <= endDate;
        });
      };

      // Inventory Audit
      const lowStockThreshold = 10;
      const deadStockDays = 90;
      const lowStockItems = products.filter(p => (p.stock || 0) < lowStockThreshold).length;
      
      // Calculate dead stock
      const deadStock = products.filter(p => {
        const lastSale = salesBills.find(b => 
          b.items?.some(i => i.code === p.id)
        );
        if (!lastSale) return true;
        const daysSinceLastSale = Math.floor(
          (new Date() - new Date(lastSale.date)) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastSale > deadStockDays;
      });
      const deadStockValue = deadStock.reduce((sum, p) => 
        sum + ((p.stock || 0) * (p.buyingRate || 0)), 0
      );

      // Purchase Audit
      const periodPurchases = filterByDateRange(purchaseBills);
      const pendingBills = periodPurchases.filter(bill => 
        !bookEntries.some(entry => 
          entry.supplierCode === bill.supplierCode && 
          entry.debit >= parseFloat(bill.total)
        )
      ).length;
      
      const averagePurchaseValue = periodPurchases.length > 0
        ? periodPurchases.reduce((sum, bill) => sum + parseFloat(bill.total), 0) / periodPurchases.length
        : 0;
      
      // Count suppliers with purchases above average
      const supplierPurchases = {};
      periodPurchases.forEach(bill => {
        if (!supplierPurchases[bill.supplierCode]) {
          supplierPurchases[bill.supplierCode] = 0;
        }
        supplierPurchases[bill.supplierCode] += parseFloat(bill.total);
      });
      
      const topSuppliers = Object.values(supplierPurchases)
        .filter(total => total > averagePurchaseValue)
        .length;

      // Sales Audit
      const periodSales = filterByDateRange(salesBills);
      const cancelledBills = periodSales.filter(bill => bill.cancelled).length;
      const totalBills = periodSales.length;
      const returnRate = totalBills > 0 
        ? (periodSales.filter(bill => bill.returned).length / totalBills) * 100 
        : 0;

      // Price overrides
      const priceOverrides = periodSales.reduce((count, bill) => {
        return count + (bill.items?.filter(item => 
          item.rate !== products.find(p => p.id === item.code)?.sellingRate
        ).length || 0);
      }, 0);

      // Expense Audit
      const periodExpenses = filterByDateRange(bookEntries)
        .filter(entry => entry.debit > 0 && !entry.supplierCode); // Expenses are debits without supplier
      
      const monthlyExpenses = periodExpenses
        .reduce((sum, entry) => sum + parseFloat(entry.debit), 0);
      
      // Calculate expense variance from previous period
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(endDate);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
      
      const previousExpenses = bookEntries
        .filter(entry => {
          const date = new Date(entry.date);
          return date >= previousPeriodStart && 
                 date <= previousPeriodEnd &&
                 entry.debit > 0 && 
                 !entry.supplierCode;
        })
        .reduce((sum, entry) => sum + parseFloat(entry.debit), 0);
      
      const expenseVariance = previousExpenses > 0
        ? ((monthlyExpenses - previousExpenses) / previousExpenses) * 100
        : 0;
      
      // Count expense categories above average
      const expensesByCategory = {};
      periodExpenses.forEach(entry => {
        if (!expensesByCategory[entry.acHead]) {
          expensesByCategory[entry.acHead] = 0;
        }
        expensesByCategory[entry.acHead] += parseFloat(entry.debit);
      });
      
      const avgExpensePerCategory = Object.values(expensesByCategory)
        .reduce((sum, total) => sum + total, 0) / Object.keys(expensesByCategory).length;
      
      const highExpenseCategories = Object.values(expensesByCategory)
        .filter(total => total > avgExpensePerCategory)
        .length;

      setAuditMetrics({
        inventory: {
          stockVariance: 2.3, // This would need physical inventory count
          lowStockItems,
          deadStockValue
        },
        purchases: {
          pendingBills,
          averagePurchaseValue,
          topSuppliers
        },
        sales: {
          returnRate,
          cancelledBills,
          priceOverrides
        },
        expenses: {
          monthlyExpenses,
          expenseVariance,
          highExpenseCategories
        }
      });
    } catch (error) {
      console.error('Error calculating audit metrics:', error);
    }
  };

  const calculateGrowthRate = (type) => {
    switch(type) {
      case 'conservative': return 0.05;
      case 'moderate': return 0.10;
      case 'aggressive': return 0.15;
      default: return 0.05;
    }
  };

  const calculateMetrics = () => {
    try {
      // Load all data sources
      const salesData = JSON.parse(localStorage.getItem('salesBills') || '[]');
      const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Calculate today's sales
      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesData
        .filter(bill => bill.date === today)
        .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);

      // Calculate credit sales and pending payments
      const creditSales = salesData
        .filter(bill => bill.paymentType === 'credit')
        .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
      
      const totalPayments = bookEntries
        .filter(entry => entry.custCode && entry.credit > 0)
        .reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);
      
      const pendingPayments = creditSales - totalPayments;

      // Calculate current year sales
      const currentYearSales = salesData
        .filter(bill => new Date(bill.date).getFullYear() === selectedYear)
        .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);

      // Calculate average order value
      const totalOrders = salesData.length;
      const averageOrderValue = totalOrders > 0 ? currentYearSales / totalOrders : 0;

      // Calculate customer retention rate
      const activeCustomers = new Set(
        salesData
          .filter(bill => new Date(bill.date).getFullYear() === selectedYear)
          .map(bill => bill.custCode)
      ).size;
      const customerRetentionRate = customers.length > 0 
        ? (activeCustomers / customers.length) * 100 
        : 0;
      
      // Calculate overdue payments and risk accounts
      const overduePayments = salesData
        .filter(bill => bill.paymentType === 'credit')
        .reduce((count, bill) => {
          const billDate = new Date(bill.date);
          const dueDate = new Date(billDate);
          dueDate.setDate(billDate.getDate() + 30);
          return new Date() > dueDate ? count + 1 : count;
        }, 0);

      const riskAccounts = customers.filter(customer => {
        const customerBills = salesData
          .filter(bill => bill.custCode === customer.id && bill.paymentType === 'credit')
          .reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
        return customerBills > (customer.creditLimit || 0);
      }).length;

      setMetrics({
        todaySales,
        creditSales,
        overduePayments,
        riskAccounts,
        pendingPayments,
        totalOrders,
        totalCustomers: customers.length,
        currentYearSales,
        averageOrderValue,
        customerRetentionRate,
        marketShare: 0 // This would need external market data to calculate
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      setMetrics({
        todaySales: 0,
        creditSales: 0,
        pendingPayments: 0,
        totalOrders: 0,
        totalCustomers: 0,
        currentYearSales: 0,
        averageOrderValue: 0,
        customerRetentionRate: 0,
        marketShare: 0
      });
    }
  };

  const calculateProjections = () => {
    const growthRate = calculateGrowthRate(projectionType);
    const nextYearProjection = metrics.currentYearSales * (1 + growthRate);
    const twoYearProjection = nextYearProjection * (1 + growthRate);

    return {
      currentYear: metrics.currentYearSales,
      nextYear: nextYearProjection,
      twoYear: twoYearProjection
    };
  };

  const projections = calculateProjections();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - 2 + i}>
                FY {new Date().getFullYear() - 2 + i}
              </option>
            ))}
          </select>
          <select
            value={projectionType}
            onChange={(e) => setProjectionType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="conservative">Conservative Growth</option>
            <option value="moderate">Moderate Growth</option>
            <option value="aggressive">Aggressive Growth</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Sales</p>
              <p className="text-2xl font-bold">₹{metrics.todaySales.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{metrics.totalOrders.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Customers</p>
              <p className="text-2xl font-bold">{metrics.totalCustomers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Growth Projection</p>
              <p className="text-2xl font-bold">
                {calculateGrowthRate(projectionType) * 100}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Audit Dashboard</h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setAuditDateRange(update)}
                className="border-none bg-transparent focus:outline-none text-sm"
                placeholderText="Select date range"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Inventory Audit</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock Variance</span>
                  <span className="text-sm font-medium">±{auditMetrics.inventory.stockVariance}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                  <span className="text-sm font-medium text-orange-600">{auditMetrics.inventory.lowStockItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dead Stock Value</span>
                  <span className="text-sm font-medium text-red-600">₹{auditMetrics.inventory.deadStockValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Purchase Audit</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Bills</span>
                  <span className="text-sm font-medium text-orange-600">{auditMetrics.purchases.pendingBills}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Purchase Value</span>
                  <span className="text-sm font-medium">₹{auditMetrics.purchases.averagePurchaseValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Top Suppliers</span>
                  <span className="text-sm font-medium text-blue-600">{auditMetrics.purchases.topSuppliers}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Sales Audit</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Return Rate</span>
                  <span className="text-sm font-medium">{auditMetrics.sales.returnRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cancelled Bills</span>
                  <span className="text-sm font-medium text-red-600">{auditMetrics.sales.cancelledBills}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Overrides</span>
                  <span className="text-sm font-medium text-orange-600">{auditMetrics.sales.priceOverrides}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Expense Audit</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Expenses</span>
                  <span className="text-sm font-medium">₹{auditMetrics.expenses.monthlyExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expense Variance</span>
                  <span className={`text-sm font-medium ${
                    auditMetrics.expenses.expenseVariance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {auditMetrics.expenses.expenseVariance > 0 ? '+' : ''}
                    {auditMetrics.expenses.expenseVariance.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">High Expense Categories</span>
                  <span className="text-sm font-medium text-orange-600">{auditMetrics.expenses.highExpenseCategories}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Financial Projections</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Current Year (FY {selectedYear})</p>
                <p className="text-xl font-bold">₹{projections.currentYear.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Next Year (FY {selectedYear + 1})</p>
                <p className="text-xl font-bold">₹{projections.nextYear.toLocaleString()}</p>
                <div className="flex items-center text-green-600 text-sm">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {(calculateGrowthRate(projectionType) * 100).toFixed(1)}% Growth
                </div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Two Year (FY {selectedYear + 2})</p>
                <p className="text-xl font-bold">₹{projections.twoYear.toLocaleString()}</p>
                <div className="flex items-center text-green-600 text-sm">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {(calculateGrowthRate(projectionType) * 200).toFixed(1)}% Growth
                </div>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Credit Sales Analysis</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-gray-600">Credit Sales</div>
              <div className="text-lg font-semibold">₹{metrics.creditSales.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">
                {((metrics.creditSales / metrics.currentYearSales) * 100).toFixed(1)}% of total sales
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <div className="text-sm text-gray-600">Pending Payments</div>
              <div className="text-lg font-semibold">₹{metrics.pendingPayments.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">
                {((metrics.pendingPayments / metrics.creditSales) * 100).toFixed(1)}% of credit sales
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-sm text-gray-600">Collection Efficiency</div>
              <div className="text-lg font-semibold">
                {((1 - metrics.pendingPayments / metrics.creditSales) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                of credit sales collected
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-orange-50/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Credit Risk Audit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg">
                <div className="text-sm text-gray-600">Overdue Payments</div>
                <div className="text-lg font-semibold text-orange-600">{metrics.overduePayments}</div>
                <div className="text-sm text-gray-500 mt-1">
                  payments past due date
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-sm text-gray-600">Risk Accounts</div>
                <div className="text-lg font-semibold text-red-600">{metrics.riskAccounts}</div>
                <div className="text-sm text-gray-500 mt-1">
                  exceeded credit limit
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;