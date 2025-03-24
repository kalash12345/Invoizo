import React, { useState, useEffect } from 'react';
import { Plus, FileDown, FileUp, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    stock: '',
    dateAdded: new Date().toISOString().split('T')[0],
    supplier: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  };
  
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData({
        id: uuidv4(),
        name: '',
        stock: '',
        dateAdded: new Date().toISOString().split('T')[0],
        supplier: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProducts = [...products, formData];
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
    toggleModal();
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id?.includes(searchTerm)
  );

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Stock', 'Date Added', 'Supplier'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        product.name,
        product.stock,
        product.dateAdded,
        product.supplier
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <FileDown className="w-5 h-5" />
            Export
          </button>
          <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50">
            <FileUp className="w-5 h-5" />
            Import
          </button>
          <button 
            onClick={toggleModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">{product.id}</td>
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4">{parseFloat(product.stock).toLocaleString()}</td>
                    <td className="px-6 py-4">{new Date(product.dateAdded).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{product.supplier}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={toggleModal}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add Product</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">ID</label>
                <input 
                  type="text" 
                  value={formData.id} 
                  readOnly 
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg"
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Initial Stock</label>
                <input 
                  type="number" 
                  name="stock" 
                  value={formData.stock} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg"
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Date Added</label>
                <input 
                  type="date" 
                  name="dateAdded" 
                  value={formData.dateAdded} 
                  readOnly 
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Supplier</label>
                <input 
                  type="text" 
                  name="supplier" 
                  value={formData.supplier} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-lg"
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;