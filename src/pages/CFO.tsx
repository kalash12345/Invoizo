import React, { useState, useEffect } from 'react';
import fetch from 'cross-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Brain, Send, AlertCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';

// Polyfill fetch globally
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

const CFO = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessMetrics, setBusinessMetrics] = useState({
    revenue: 0, // From sales bills
    expenses: 0, // From purchase bills and expense entries
    profit: 0, // Revenue - Expenses
    cashFlow: 0 // Net movement from cash ledger
  });

  useEffect(() => {
    calculateBusinessMetrics();
  }, []);

  const calculateBusinessMetrics = () => {
    const salesData = JSON.parse(localStorage.getItem('salesBills') || '[]');
    const purchaseData = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
    const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');

    // Calculate revenue from sales
    const revenue = salesData.reduce((sum, bill) => {
      const total = parseFloat(bill.total) || 0;
      return sum + total;
    }, 0);
    
    // Calculate expenses from purchases and expense entries
    const purchaseExpenses = purchaseData.reduce((sum, bill) => {
      const total = parseFloat(bill.total) || 0;
      return sum + total;
    }, 0);
    
    const ledgerExpenses = bookEntries
      .filter(entry => entry.debit > 0) // Debit entries represent expenses
      .reduce((sum, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        return sum + debit;
      }, 0);
    
    const expenses = purchaseExpenses + ledgerExpenses;
    const profit = revenue - expenses;
    
    // Calculate cash flow from ledger entries
    const cashFlow = bookEntries.reduce((net, entry) => {
      const credit = parseFloat(entry.credit) || 0;
      const debit = parseFloat(entry.debit) || 0;
      return net + credit - debit;
    }, 0);

    setBusinessMetrics({
      revenue,
      expenses,
      profit,
      cashFlow
    });
  };

  const generateAIResponse = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('API key not configured. Please check your environment variables.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (!query.trim()) {
        throw new Error('Please enter a question');
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Prepare context for the AI
      const context = {
        businessMetrics,
        salesData: JSON.parse(localStorage.getItem('salesBills') || '[]'),
        purchaseData: JSON.parse(localStorage.getItem('purchaseBills') || '[]'),
        customers: JSON.parse(localStorage.getItem('customers') || '[]'),
        suppliers: JSON.parse(localStorage.getItem('suppliers') || '[]'),
        products: JSON.parse(localStorage.getItem('products') || '[]')
      };

      // Generate response
      const prompt = `You are an expert CFO analyzing business data. Based on the following financial metrics and data, provide a detailed analysis for this query: ${query}

Business Context:
Current Business Metrics:
- Revenue: ₹${context.businessMetrics.revenue.toLocaleString()}
- Expenses: ₹${context.businessMetrics.expenses.toLocaleString()}
- Profit: ₹${context.businessMetrics.profit.toLocaleString()}
- Cash Flow: ₹${context.businessMetrics.cashFlow.toLocaleString()}

Business Statistics:
- Total Customers: ${context.customers.length}
- Total Active Customers: ${context.customers.length}
- Total Products: ${context.products.length}
- Total Sales Bills: ${context.salesData.length}
- Total Purchase Bills: ${context.purchaseData.length}

Please provide a detailed analysis focusing on the specific query: ${query}

Format your response in clear sections with bullet points where appropriate.
Keep the analysis professional and actionable.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setResponse(response.text());
    } catch (err) {
      console.error('AI Error:', err);
      setError(err.message || 'Failed to generate AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    generateAIResponse();
  };

  const downloadReport = () => {
    const report = `
CFO Analysis Report
------------------
Date: ${new Date().toLocaleDateString()}

Business Metrics
---------------
Revenue: ₹${businessMetrics.revenue.toLocaleString()}
Expenses: ₹${businessMetrics.expenses.toLocaleString()}
Profit: ₹${businessMetrics.profit.toLocaleString()}
Cash Flow: ₹${businessMetrics.cashFlow.toLocaleString()}

AI Analysis
-----------
${response}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cfo-analysis-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <Brain className="w-8 h-8 mr-2 text-blue-600" />
          AI Chief Financial Officer
        </h1>
        <div className="flex gap-2">
          <button
            onClick={downloadReport}
            disabled={!response}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Revenue</span>
              <span className="text-lg">₹{businessMetrics.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="font-medium">Expenses</span>
              <span className="text-lg">₹{businessMetrics.expenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Profit</span>
              <span className="text-lg">₹{businessMetrics.profit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Cash Flow</span>
              <span className="text-lg">₹{businessMetrics.cashFlow.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <FileSpreadsheet className="w-6 h-6 mb-2 text-blue-600" />
              <div className="font-medium">Generate Report</div>
              <div className="text-sm text-gray-500">Financial statements and analysis</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <FileText className="w-6 h-6 mb-2 text-green-600" />
              <div className="font-medium">Tax Planning</div>
              <div className="text-sm text-gray-500">Optimize tax strategy</div>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">AI Financial Assistant</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask your financial question... (e.g., 'Analyze our current financial health' or 'Suggest ways to improve cash flow')"
              className="w-full p-4 pr-12 border rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 bottom-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : response && (
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6">
              {response.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CFO;