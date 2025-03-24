import React, { useState, useRef } from 'react';
import { 
  Plus, 
  ImagePlus, 
  X, 
  BookOpen, 
  Grid, 
  Tags, 
  AlignVerticalSpaceAround 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCatalog = () => {
  // Product management state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Form states for adding categories and products
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    description: '',
    image: null
  });

  // UI State
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Ref for file input
  const fileInputRef = useRef(null);

  // Category Management
  const addCategory = () => {
    if (newCategory.trim() && !categories.some(cat => cat.name === newCategory.trim())) {
      setCategories([
        ...categories, 
        {
          name: newCategory.trim(),
          color: `hsl(${Math.random() * 360}, 70%, 80%)` // Random pastel color
        }
      ]);
      setNewCategory('');
    }
  };

  // Product Management
  const handleProductImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.image) {
      setProducts([...products, {
        ...newProduct,
        id: Date.now(), // Unique identifier
        orientation: Math.random() > 0.5 ? 'book' : 'card' // Random presentation style
      }]);
      // Reset form and close modal
      setNewProduct({
        name: '',
        category: '',
        description: '',
        image: null
      });
      setIsAddProductModalOpen(false);
    }
  };

  // Filtering products
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="container mx-auto space-y-8">
        {/* Category Management Section */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <div className="flex items-center mb-4">
            <Tags className="mr-3 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-grow">
              <input 
                type="text" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Create new category"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <button 
              onClick={addCategory}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            >
              <Plus className="mr-2" /> Add
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(category => (
              <motion.div 
                key={category.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center bg-gray-100 px-3 py-1 rounded-full"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
                <button 
                  onClick={() => {
                    // Remove category and associated products
                    setCategories(categories.filter(cat => cat.name !== category.name));
                    setProducts(products.filter(p => p.category !== category.name));
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Product Catalog Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <AlignVerticalSpaceAround className="mr-3 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800">Product Catalog</h2>
            </div>

            {/* View Mode and Add Product */}
            <div className="flex items-center space-x-4">
              {/* View Mode Toggles */}
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Grid />
                </button>
                <button 
                  onClick={() => setViewMode('book')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'book' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen />
                </button>
              </div>

              {/* Add Product Button */}
              <button 
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors"
              >
                <Plus className="mr-2" /> Add Product
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === null 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.name ? null : category.name
                )}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === category.name 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No products added yet
            </div>
          ) : (
            <div className={`grid ${
              viewMode === 'grid' 
                ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' 
                : 'grid-cols-1 gap-6'
            }`}
            >
              <AnimatePresence>
                {filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative"
                  >
                    {/* Product Card - Same as previous implementation */}
                    {/* (Keep the existing product display logic) */}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Add Product Modal */}
        <AnimatePresence>
          {isAddProductModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
                  <button 
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="col-span-2 h-64 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    {newProduct.image ? (
                      <img 
                        src={newProduct.image} 
                        alt="Product Preview" 
                        className="max-h-full max-w-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImagePlus className="mx-auto mb-4 text-blue-500" size={48} />
                        <p>Click to upload product image</p>
                      </div>
                    )}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Product Details */}
                  <input 
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({...prev, name: e.target.value}))}
                    placeholder="Product Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({...prev, category: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({...prev, description: e.target.value}))}
                    placeholder="Product Description"
                    className="col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
                  ></textarea>

                  <button 
                    onClick={addProduct}
                    className="col-span-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductCatalog;