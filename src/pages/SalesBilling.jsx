import React, { useState, useRef, useEffect } from "react";
import { Search, X, Printer, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PrintService } from "../services/PrintService";

const SalesBilling = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    invoiceNo: "001",
    date: new Date().toISOString().split('T')[0],
    paymentType: "cash",
    custCode: "",
    through: "",
    custName: "",
    address: ""
  });
  const [items, setItems] = useState([{ code: "", name: "", qty: 0, case: 0, disc: 0, rate: 0, amount: 0 }]);
  
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [copies, setCopies] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  
  const invoiceRef = useRef(null);
  const dateRef = useRef(null);
  const paymentTypeRef = useRef(null);
  const custCodeRef = useRef(null);
  const throughRef = useRef(null);
  const custNameRef = useRef(null);
  const addressRef = useRef(null);
  const inputRefs = useRef([]);
  const printButtonRef = useRef(null);
  const searchInputRef = useRef(null);

  const headerFields = [
    { ref: invoiceRef, next: dateRef },
    { ref: dateRef, next: paymentTypeRef },
    { ref: paymentTypeRef, next: custCodeRef },
    { ref: custCodeRef, next: throughRef },
    { ref: throughRef, next: custNameRef },
    { ref: custNameRef, next: addressRef },
    { ref: addressRef, next: null }
  ];

  const handleHeaderKeyDown = (e, currentField) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (currentField === custCodeRef) {
        const customer = lookupCustomerByCode(formData.custCode);
        if (!customer) {
          setShowCustomerSearch(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
          return;
        }
      }

      const currentIndex = headerFields.findIndex(field => field.ref === currentField);
      if (currentIndex < headerFields.length - 1) {
        headerFields[currentIndex + 1].ref.current?.focus();
      } else {
        if (inputRefs.current[0] && inputRefs.current[0][0]) {
          inputRefs.current[0][0].focus();
        }
      }
    }
  };

  useEffect(() => {
    generateNextInvoiceNumber();
  }, []);


  const generateNextInvoiceNumber = () => {
    const salesData = JSON.parse(localStorage.getItem('salesBills') || '[]');
    let nextNumber = 1;
    
    if (salesData.length > 0) {
      const highestInvoice = salesData.reduce((max, bill) => {
        const num = parseInt(bill.invoiceNo);
        return num > max ? num : max;
      }, 0);
      nextNumber = highestInvoice + 1;
    }

    setFormData(prev => ({
      ...prev,
      invoiceNo: nextNumber.toString().padStart(3, '0')
    }));
  };

  const handleCustomerSearch = (searchTerm) => {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const lookupCustomerByCode = (code) => {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    return customers.find(customer => customer.id === code);
  };

  const handleProductSearch = (searchTerm) => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const selectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      custCode: customer.id,
      custName: customer.name,
      address: customer.address
    }));
    setShowCustomerSearch(false);
    throughRef.current?.focus();
  };

  const selectProduct = (product, index) => {
    const newItems = [...items];
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const selectedProduct = products.find(p => p.id === product.id);
    
    newItems[index] = {
      ...newItems[index],
      code: product.id,
      name: product.name,
      piecesPerCase: parseInt(selectedProduct?.packaging || '1')
    };
    setItems(newItems);
    setShowProductSearch(false);
    if (inputRefs.current[index]) {
      inputRefs.current[index][2].focus(); // Focus on rate field
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'custCode' && value) {
      const customer = lookupCustomerByCode(value);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          custCode: customer.id,
          custName: customer.name,
          address: customer.address
        }));
      }
    }
  };

  const handleInputChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (["qty", "case", "disc", "rate"].includes(field)) {
      const individualPieces = parseFloat(newItems[index].qty) || 0;
      const casePieces = (parseFloat(newItems[index].case) || 0) * (newItems[index].piecesPerCase || 1);
      const totalPieces = individualPieces + casePieces;
      const rate = parseFloat(newItems[index].rate) || 0;
      const discount = parseFloat(newItems[index].disc) || 0;
      
      // Calculate final amount with discount
      const amount = totalPieces * rate * (1 - discount / 100);
      newItems[index].amount = amount.toFixed(2);
    }
    setItems(newItems);
  };

  const handleItemKeyDown = (e, index, fieldIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (fieldIndex === 0 && !items[index].code) {
        setActiveItemIndex(index);
        setShowProductSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        return;
      }

      const totalFields = 6;
      const nextFieldIndex = fieldIndex + 1;
      
      if (nextFieldIndex < totalFields) {
        inputRefs.current[index][nextFieldIndex].focus();
      } else {
        if (index === items.length - 1) {
          setItems([...items, { code: "", name: "", qty: 0, case: 0, disc: 0, rate: 0, amount: 0 }]);
          setTimeout(() => inputRefs.current[index + 1][0].focus(), 100);
        } else {
          inputRefs.current[index + 1][0].focus();
        }
      }
    }
  };

  const handleSearchKeyDown = (e, results, selectItem) => {
    if (e.key === "Escape") {
      setShowCustomerSearch(false);
      setShowProductSearch(false);
    } else if (e.key === "Enter" && results.length > 0) {
      selectItem(results[0]);
    }
  };

  const updateInventory = (items) => {
    try {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const currentDate = new Date().toISOString();
      
      items.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.code);
        if (productIndex !== -1) {
          const piecesFromCases = (parseFloat(item.case) || 0) * (item.piecesPerCase || 1);
          const individualPieces = parseFloat(item.qty) || 0;
          const totalPieces = piecesFromCases + individualPieces;
          
          // Check if enough stock is available
          const currentStock = parseFloat(products[productIndex].stock) || 0;
          if (currentStock < totalPieces) {
            throw new Error(`Insufficient stock for ${products[productIndex].name}. Available: ${currentStock}, Required: ${totalPieces}`);
          }
          
          // Update stock
          products[productIndex].stock = currentStock - totalPieces;
          products[productIndex].lastUpdated = currentDate;
        }
      });

      localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  };

  const handleSave = () => {
    try {
      // Validate all items have required fields
      const invalidItems = items.filter(item => !item.code || !item.name);
      if (invalidItems.length > 0) {
        throw new Error('Please fill in all product details');
      }

      // Update inventory first to check stock availability
      updateInventory(items);

      // If inventory update succeeds, save the bill
      const salesData = JSON.parse(localStorage.getItem('salesBills') || '[]');
      const newBill = {
        ...formData,
        items,
        timestamp: new Date().toISOString(),
        total: items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2)
      };
      
      salesData.push(newBill);
      localStorage.setItem('salesBills', JSON.stringify(salesData));

      // Reset form
      setItems([{ code: "", name: "", qty: 0, case: 0, disc: 0, rate: 0, amount: 0 }]);
      generateNextInvoiceNumber();
      setFormData(prev => ({
        ...prev,
        custCode: "",
        through: "",
        custName: "",
        address: "",
        date: new Date().toISOString().split('T')[0]
      }));

      alert('Bill saved successfully');
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePrint = async () => {
    try {
      const printService = PrintService.getInstance();
      const business = JSON.parse(localStorage.getItem('business') || '{}');
      const settings = JSON.parse(localStorage.getItem('printerSettings') || '{}');

      const content = printService.formatBillContent(
        { ...formData, items, total: items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) },
        business,
        settings
      );

      const success = await printService.print(content, {
        type: formData.paymentType,
        copies,
        printer: selectedPrinter
      });

      if (!success) {
        throw new Error('Printing failed');
      }

      setShowPrintDialog(false);
    } catch (error) {
      alert('Error printing bill: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Sales Billing</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold">Invoice No:</label>
          <input
            ref={invoiceRef}
            type="text"
            value={formData.invoiceNo}
            className="w-1/2 p-2 border rounded bg-gray-100"
            onKeyDown={(e) => handleHeaderKeyDown(e, invoiceRef)}
            readOnly
          />
        </div>
        <div>
          <label className="block font-semibold">Date:</label>
          <input
            ref={dateRef}
            type="date"
            className="w-1/2 p-2 border rounded"
            value={formData.date}
            onChange={(e) => handleFormChange('date', e.target.value)}
            onKeyDown={(e) => handleHeaderKeyDown(e, dateRef)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Payment Type:</label>
        <select
          ref={paymentTypeRef}
          className="w-1/4 p-2 border rounded"
          value={formData.paymentType}
          onChange={(e) => handleFormChange('paymentType', e.target.value)}
          onKeyDown={(e) => handleHeaderKeyDown(e, paymentTypeRef)}
        >
          <option value="cash">Cash</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold">Cust Code:</label>
          <input
            ref={custCodeRef}
            type="text"
            className="w-3/4 p-2 border rounded"
            value={formData.custCode}
            onChange={(e) => handleFormChange('custCode', e.target.value)}
            onKeyDown={(e) => handleHeaderKeyDown(e, custCodeRef)}
          />
        </div>
        <div>
          <label className="block font-semibold">Thro':</label>
          <input
            ref={throughRef}
            type="text"
            className="w-3/4 p-2 border rounded"
            value={formData.through}
            onChange={(e) => handleFormChange('through', e.target.value)}
            onKeyDown={(e) => handleHeaderKeyDown(e, throughRef)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Cust Name:</label>
        <input
          ref={custNameRef}
          type="text"
          className="w-full p-2 border rounded"
          value={formData.custName}
          onChange={(e) => handleFormChange('custName', e.target.value)}
          onKeyDown={(e) => handleHeaderKeyDown(e, custNameRef)}
          readOnly
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold">Address:</label>
        <input
          ref={addressRef}
          type="text"
          className="w-full p-2 border rounded"
          value={formData.address}
          onChange={(e) => handleFormChange('address', e.target.value)}
          onKeyDown={(e) => handleHeaderKeyDown(e, addressRef)}
          readOnly
        />
      </div>

      <table className="w-full border-collapse border mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Code</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Case</th>
            <th className="border p-2">Disc %</th>
            <th className="border p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              {["code", "name", "rate", "qty", "case", "disc"].map((field, fieldIndex) => (
                <td key={field} className="border p-2">
                  <input
                    type={field === "code" || field === "name" ? "text" : "number"}
                    className="w-full p-1 border rounded"
                    value={item[field]}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                    onKeyDown={(e) => handleItemKeyDown(e, index, fieldIndex)}
                    ref={(el) => {
                      if (!inputRefs.current[index]) inputRefs.current[index] = [];
                      inputRefs.current[index][fieldIndex] = el;
                    }}
                    readOnly={field === "name"}
                  />
                </td>
              ))}
              <td className="border p-2">{item.amount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td colSpan="6" className="border p-2 text-right font-bold">Total:</td>
            <td className="border p-2 font-bold">
              ₹{items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="flex justify-center space-x-4 mt-6">
        <button 
          ref={printButtonRef} 
          onClick={() => setShowPrintDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave}>Save</button>
        <button className="bg-red-600 text-white px-4 py-2 rounded">Exit</button>
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Search Customer</h3>
              <button onClick={() => setShowCustomerSearch(false)}>
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
                onKeyDown={(e) => handleSearchKeyDown(e, handleCustomerSearch(searchTerm), selectCustomer)}
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {handleCustomerSearch(searchTerm).map((customer) => (
                <div
                  key={customer.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectCustomer(customer)}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">Code: {customer.id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Search Product</h3>
              <button onClick={() => setShowProductSearch(false)}>
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
                onKeyDown={(e) => handleSearchKeyDown(e, handleProductSearch(searchTerm), 
                  (product) => selectProduct(product, activeItemIndex))}
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {handleProductSearch(searchTerm).map((product) => (
                <div
                  key={product.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectProduct(product, activeItemIndex)}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    Code: {product.id} | Stock: {product.stock || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Print Bill</h3>
              <button onClick={() => setShowPrintDialog(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Printer
                </label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Default Printer</option>
                  {PrintService.getInstance().getAvailablePrinters().map(printer => (
                    <option key={printer} value={printer}>{printer}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <Settings className="w-4 h-4" />
                  Print Settings
                </button>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowPrintDialog(false)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesBilling;

