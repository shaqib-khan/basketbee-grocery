import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const toast = useToast();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'BasketBee Select',
    category: '',
    subcategory: 'General',
    description: '',
    mrp: '',
    sellingPrice: '',
    unit: '1 kg',
    weight: '1',
    stock: 50,
    image: '',
    isBestSeller: false,
    isTrending: false,
    isFreshPick: false,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProducts({
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        limit: 100,
      });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryAPI.getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: 'BasketBee Select',
      category: categories[0]?._id || '',
      subcategory: 'General',
      description: 'Fresh and premium quality grocery product sourced directly from verified local farms and trusted distributors.',
      mrp: '100',
      sellingPrice: '85',
      unit: '1 kg',
      weight: '1',
      stock: 50,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      isBestSeller: false,
      isTrending: false,
      isFreshPick: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category?._id || product.category,
      subcategory: product.subcategory || 'General',
      description: product.description,
      mrp: product.mrp ?? product.originalPrice ?? '',
      sellingPrice: product.sellingPrice ?? product.discountedPrice ?? '',
      unit: product.unit || '1 kg',
      weight: product.weight || '',
      stock: product.stock,
      image: product.image,
      isBestSeller: product.isBestSeller,
      isTrending: product.isTrending,
      isFreshPick: product.isFreshPick,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grocery product?')) return;
    try {
      const res = await productAPI.deleteProduct(id);
      if (res.success) {
        toast.success('Product deleted successfully');
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const mrpNum = Number(formData.mrp);
    const sellingPriceNum = Number(formData.sellingPrice);

    if (isNaN(mrpNum) || mrpNum <= 0) {
      toast.error('Please enter a valid MRP greater than 0');
      return;
    }
    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
      toast.error('Please enter a valid Selling Price greater than 0');
      return;
    }
    if (sellingPriceNum > mrpNum) {
      toast.error(`Validation Error: Selling price (₹${sellingPriceNum}) cannot be greater than MRP (₹${mrpNum})!`);
      return;
    }

    const payload = {
      ...formData,
      mrp: mrpNum,
      sellingPrice: sellingPriceNum,
      originalPrice: mrpNum,
      discountedPrice: sellingPriceNum,
      stock: Number(formData.stock),
    };

    try {
      if (editingProduct) {
        const res = await productAPI.updateProduct(editingProduct._id, payload);
        if (res.success) {
          toast.success('Product updated successfully');
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        const res = await productAPI.createProduct(payload);
        if (res.success) {
          toast.success('Product created successfully');
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Title & Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Inventory &amp; Product Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Total of {products.length} catalog items loaded
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search products by title or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-emerald-600"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price / MRP</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/fallback-grocery.svg';
                        }}
                        className="w-11 h-11 object-contain p-0.5 rounded-xl border border-gray-100 flex-shrink-0 bg-gray-50"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate max-w-xs">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.brand} &bull; {p.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-700">{p.categoryName}</span>
                    <div className="text-[10px] text-gray-400">{p.subcategory}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-black text-emerald-950 text-sm">
                      ₹{p.sellingPrice ?? p.discountedPrice}
                    </span>
                    {(p.mrp ?? p.originalPrice) > (p.sellingPrice ?? p.discountedPrice) && (
                      <span className="text-[11px] text-gray-400 line-through ml-1.5 font-medium">
                        ₹{p.mrp ?? p.originalPrice}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {(p.discountPercentage ?? p.discountPercent) > 0 ? (
                      <span className="badge-discount">{p.discountPercentage ?? p.discountPercent}% OFF</span>
                    ) : (
                      <span className="text-gray-400 font-medium">0%</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-black text-[11px] px-2.5 py-0.5 rounded-full ${
                        p.stock <= 0
                          ? 'bg-red-100 text-red-800'
                          : p.stock <= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-lg text-gray-900">
                {editingProduct ? 'Edit Grocery Product' : 'Add New Grocery Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">MRP ₹ (Max Retail Price) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. 180"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price ₹ (Offer) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className={`w-full px-3 py-2 text-xs bg-gray-50 border rounded-xl focus:outline-none ${
                      Number(formData.sellingPrice) > Number(formData.mrp) && Number(formData.mrp) > 0
                        ? 'border-red-500 focus:border-red-500 bg-red-50/30'
                        : 'border-gray-200 focus:border-emerald-600'
                    }`}
                    placeholder="e.g. 149"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Units *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Live Discount & Validation Feedback */}
              {Number(formData.mrp) > 0 && Number(formData.sellingPrice) > 0 && (
                <div>
                  {Number(formData.sellingPrice) > Number(formData.mrp) ? (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Selling price (₹{formData.sellingPrice}) cannot exceed MRP (₹{formData.mrp})!</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
                      <span>
                        Calculated Discount:{' '}
                        <strong className="text-emerald-950 font-black">
                          {Math.round(((Number(formData.mrp) - Number(formData.sellingPrice)) / Number(formData.mrp)) * 100)}% OFF
                        </strong>
                      </span>
                      <span>Customer Saves ₹{Number(formData.mrp) - Number(formData.sellingPrice)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pack Size / Unit (e.g. 500 g, 1 kg) *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="flex items-center space-x-6 text-xs font-bold text-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Trending</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFreshPick}
                    onChange={(e) => setFormData({ ...formData, isFreshPick: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Farm Pick</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;

