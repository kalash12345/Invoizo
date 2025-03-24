import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const PurchaseEntryForm = () => {
  const [formData, setFormData] = useState({
    invoiceNo: '001',
    supplierInvoiceNo: '',
    supplierInvoiceDate: new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0],
    supplierCode: '',
    supplierName: '',
    address: '',
    carton: 0,
    freight: 0,
    tax: 0,
    total: 0
  });

  const [items, setItems] = useState([{
    code: '',
    name: '',
    qty: 0,
    case: 0,
    rate: 0,
    amount: 0
  }]);

  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  const searchInputRef = useRef(null);
  const inputRefs = useRef([]);
  const invoiceRef = useRef(null);
  const dateRef = useRef(null);
  const supplierInvoiceNoRef = useRef(null);
  const supplierInvoiceDateRef = useRef(null);
  const supplierCodeRef = useRef(null);

  const lookupSupplierByCode = (code) => {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    return suppliers.find(supplier => supplier.id === code);
  };

  const headerFields = [
    { ref: invoiceRef, next: dateRef },
    { ref: dateRef, next: supplierInvoiceNoRef },
    { ref: supplierInvoiceNoRef, next: supplierInvoiceDateRef },
    { ref: supplierInvoiceDateRef, next: supplierCodeRef },
    { ref: supplierCodeRef, next: null }
  ];

  const handleHeaderKeyDown = (e, currentField) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (currentField === supplierCodeRef) {
        const supplier = lookupSupplierByCode(formData.supplierCode);
        if (!supplier) {
          setShowSupplierSearch(true);
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

  const handleItemKeyDown = (e, index, fieldIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (fieldIndex === 0 && !items[index].code) {
        setActiveItemIndex(index);
        setShowProductSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        return;
      }

      const totalFields = 5; // code, name, rate, qty, case
      const nextFieldIndex = fieldIndex + 1;
      
      if (nextFieldIndex < totalFields) {
        inputRefs.current[index][nextFieldIndex].focus();
      } else {
        if (index === items.length - 1) {
          setItems([...items, { code: '', name: '', qty: 0, case: 0, rate: 0, amount: 0 }]);
          setTimeout(() => inputRefs.current[index + 1][0].focus(), 100);
        } else {
          inputRefs.current[index + 1][0].focus();
        }
      }
    }
  };

  useEffect(() => {
    generateNextInvoiceNumber();
  }, []);

  const generateNextInvoiceNumber = () => {
    const purchaseData = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
    let nextNumber = 1;
    
    if (purchaseData.length > 0) {
      const highestInvoice = purchaseData.reduce((max, bill) => {
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

  const handleSupplierSearch = (searchTerm) => {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleProductSearch = (searchTerm) => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const selectSupplier = (supplier) => {
    setFormData(prev => ({
      ...prev,
      supplierCode: supplier.id,
      supplierName: supplier.name,
      address: supplier.address
    }));
    setShowSupplierSearch(false);
  };

  const selectProduct = (product, index) => {
    const newItems = [...items];
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const selectedProduct = products.find(p => p.id === product.id);
    
    newItems[index] = {
      ...newItems[index],
      code: product.id,
      rate: product.buyingRate || 0,
      name: product.name,
      piecesPerCase: parseInt(selectedProduct?.packaging || '1')
    };
    setItems(newItems);
    setShowProductSearch(false);
    if (inputRefs.current[index]) {
      inputRefs.current[index][2].focus(); // Focus on qty field
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Recalculate total
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      newData.total = (
        subtotal +
        (parseFloat(newData.freight) || 0) +
        (parseFloat(newData.tax) || 0)
      ).toFixed(2);
      return newData;
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate amount
    if (['qty', 'case', 'rate'].includes(field)) {
      const individualPieces = parseFloat(newItems[index].qty) || 0;
      const casePieces = (parseFloat(newItems[index].case) || 0) * (newItems[index].piecesPerCase || 1);
      const totalPieces = individualPieces + casePieces;
      const rate = parseFloat(newItems[index].rate) || 0;
      
      newItems[index].amount = (totalPieces * rate).toFixed(2);
    }

    setItems(newItems);

    // Update total
    const subtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData(prev => ({
      ...prev,
      total: (
        subtotal +
        (parseFloat(prev.freight) || 0) +
        (parseFloat(prev.tax) || 0)
      ).toFixed(2)
    }));
  };

  const handleSearchKeyDown = (e, results, selectItem) => {
    if (e.key === 'Escape') {
      setShowSupplierSearch(false);
      setShowProductSearch(false);
    } else if (e.key === 'Enter' && results.length > 0) {
      selectItem(results[0]);
    }
  };

  const updateInventory = (items) => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const currentDate = new Date().toISOString();
    
    items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.code);
      if (productIndex !== -1) {
        const piecesFromCases = (parseFloat(item.case) || 0) * (item.piecesPerCase || 1);
        const individualPieces = parseFloat(item.qty) || 0;
        const totalPieces = piecesFromCases + individualPieces;
        
        products[productIndex].stock = (parseFloat(products[productIndex].stock) || 0) + totalPieces;
        products[productIndex].lastUpdated = currentDate;
        products[productIndex].lastSupplier = formData.supplierCode;
        products[productIndex].lastPurchaseDate = formData.date;
        products[productIndex].lastPurchaseRate = parseFloat(item.rate) || 0;
      }
    });

    localStorage.setItem('products', JSON.stringify(products));
  };

  const handleSave = () => {
    try {
      // Validate required fields
      if (!formData.supplierCode || !formData.date) {
        throw new Error('Please fill in all required fields');
      }

      // Validate items
      const invalidItems = items.filter(item => !item.code || !item.name);
      if (invalidItems.length > 0) {
        throw new Error('Please fill in all product details');
      }

      // Update inventory
      updateInventory(items);

      // Save purchase bill
      const purchaseData = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
      const newBill = {
        ...formData,
        items,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      purchaseData.push(newBill);
      localStorage.setItem('purchaseBills', JSON.stringify(purchaseData));

      // Reset form
      generateNextInvoiceNumber();
      setItems([{ code: '', name: '', qty: 0, case: 0, rate: 0, amount: 0 }]);
      setFormData({
        ...formData,
        supplierInvoiceNo: '',
        supplierInvoiceDate: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        supplierCode: '',
        supplierName: '',
        address: '',
        carton: 0,
        freight: 0,
        tax: 0,
        total: 0
      });

      alert('Purchase bill saved successfully');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Purchase Entry</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold">Our Invoice No:</label>
          <input
            ref={invoiceRef}
            type="text"
            className="w-full p-2 border rounded bg-gray-100"
            value={formData.invoiceNo}
            onKeyDown={(e) => handleHeaderKeyDown(e, invoiceRef)}
            readOnly
          />
        </div>
        <div>
          <label className="block font-semibold">Supplier Invoice No:</label>
          <input
            ref={supplierInvoiceNoRef}
            type="text"
            name="supplierInvoiceNo"
            value={formData.supplierInvoiceNo}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            onKeyDown={(e) => handleHeaderKeyDown(e, supplierInvoiceNoRef)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold">Our Date:</label>
          <input
            ref={dateRef}
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            onKeyDown={(e) => handleHeaderKeyDown(e, dateRef)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Supplier's Invoice Date:</label>
          <input
            ref={supplierInvoiceDateRef}
            type="date"
            name="supplierInvoiceDate"
            value={formData.supplierInvoiceDate}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            onKeyDown={(e) => handleHeaderKeyDown(e, supplierInvoiceDateRef)}
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Supplier Code:</label>
        <input
          ref={supplierCodeRef}
          type="text"
          value={formData.supplierCode}
          className="w-full p-2 border rounded"
          onFocus={() => setShowSupplierSearch(true)}
          onKeyDown={(e) => handleHeaderKeyDown(e, supplierCodeRef)}
          readOnly
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Supplier Name:</label>
        <input
          type="text"
          value={formData.supplierName}
          className="w-full p-2 border rounded"
          readOnly
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Address:</label>
        <input
          type="text"
          value={formData.address}
          className="w-full p-2 border rounded"
          readOnly
        />
      </div>

      <table className="w-full border-collapse border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Code</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Case</th>
            <th className="border p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="border p-2">
                <input
                  type="text"
                  ref={(el) => {
                    if (!inputRefs.current[index]) inputRefs.current[index] = [];
                    inputRefs.current[index][0] = el;
                  }}
                  value={item.code}
                  className="w-full p-1"
                  onKeyDown={(e) => handleItemKeyDown(e, index, 0)}
                  onFocus={() => {
                    setActiveItemIndex(index);
                    setShowProductSearch(true);
                  }}
                  readOnly
                />
              </td>
              <td className="border p-2">
                <input
                  type="text"
                  ref={(el) => {
                    if (!inputRefs.current[index]) inputRefs.current[index] = [];
                    inputRefs.current[index][1] = el;
                  }}
                  value={item.name}
                  className="w-full p-1"
                  readOnly
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  ref={(el) => {
                    if (!inputRefs.current[index]) inputRefs.current[index] = [];
                    inputRefs.current[index][2] = el;
                  }}
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                  className="w-full p-1"
                  onKeyDown={(e) => handleItemKeyDown(e, index, 2)}
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  ref={(el) => {
                    if (!inputRefs.current[index]) inputRefs.current[index] = [];
                    inputRefs.current[index][3] = el;
                  }}
                  value={item.qty}
                  onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                  className="w-full p-1"
                  onKeyDown={(e) => handleItemKeyDown(e, index, 3)}
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  ref={(el) => {
                    if (!inputRefs.current[index]) inputRefs.current[index] = [];
                    inputRefs.current[index][4] = el;
                  }}
                  value={item.case}
                  onChange={(e) => handleItemChange(index, 'case', e.target.value)}
                  className="w-full p-1"
                  onKeyDown={(e) => handleItemKeyDown(e, index, 4)}
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  value={item.amount}
                  className="w-full p-1 bg-gray-50"
                  readOnly
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
          <label className="text-right">Carton:</label>
          <input
            type="number"
            name="carton"
            value={formData.carton}
            onChange={handleInputChange}
            className="w-24 h-8 border rounded px-2"
          />
          <label className="text-right">Freight:</label>
          <input
            type="number"
            name="freight"
            value={formData.freight}
            onChange={handleInputChange}
            className="w-24 h-8 border rounded px-2"
          />
          <label className="text-right">Tax:</label>
          <input
            type="number"
            name="tax"
            value={formData.tax}
            onChange={handleInputChange}
            className="w-24 h-8 border rounded px-2"
          />
          <label className="text-right font-bold">Total:</label>
          <input
            type="number"
            value={formData.total}
            readOnly
            className="w-24 h-8 bg-gray-50 border rounded px-2 font-bold"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-4">
        <button 
          onClick={handleSave}
          className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save
        </button>
        <button className="px-4 py-1 text-sm border rounded hover:bg-gray-100">
          Exit
        </button>
      </div>

      {/* Supplier Search Modal */}
      {showSupplierSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Search Supplier</h3>
              <button onClick={() => setShowSupplierSearch(false)}>
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
                onKeyDown={(e) => handleSearchKeyDown(e, handleSupplierSearch(searchTerm), selectSupplier)}
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {handleSupplierSearch(searchTerm).map((supplier) => (
                <div
                  key={supplier.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectSupplier(supplier)}
                >
                  <div className="font-medium">{supplier.name}</div>
                  <div className="text-sm text-gray-600">Code: {supplier.id}</div>
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
    </div>
  );
};

export default PurchaseEntryForm;