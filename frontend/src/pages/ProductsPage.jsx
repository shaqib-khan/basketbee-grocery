import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Search,
  PackageOpen,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { ProductCardSkeleton } from '../components/common/LoadingSkeleton';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity & Rating' },
  { value: 'discount', label: 'Discount: High to Low' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Component state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Local filter states for price range
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Fetch categories for sidebar
  useEffect(() => {
    categoryAPI
      .getCategories()
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch((err) => console.warn('Could not load categories:', err));
  }, []);

  // Fetch filtered products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: categoryParam || undefined,
        search: searchParam || undefined,
        subcategory: subcategoryParam || undefined,
        minPrice: minPriceParam || undefined,
        maxPrice: maxPriceParam || undefined,
        inStock: inStockParam ? 'true' : undefined,
        sort: sortParam,
        page: pageParam,
        limit: 16,
      };

      const res = await productAPI.getProducts(params);
      if (res.success) {
        setProducts(res.data);
        setTotalProducts(res.total);
        setTotalPages(res.pages);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryParam, searchParam, subcategoryParam, minPriceParam, maxPriceParam, inStockParam, sortParam, pageParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update query params helper
  const updateFilters = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams, page: 1 };

    // Remove empty parameters
    Object.keys(updated).forEach((key) => {
      if (!updated[key] && updated[key] !== false) {
        delete updated[key];
      }
    });

    setSearchParams(updated);
  };

  const handleCategorySelect = (slug) => {
    if (categoryParam === slug) {
      updateFilters({ category: '', subcategory: '' });
    } else {
      updateFilters({ category: slug, subcategory: '' });
    }
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPriceInput || '',
      maxPrice: maxPriceInput || '',
    });
  };

  const handleResetFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  // Find active category
  const activeCategoryObj = categories.find((c) => c.slug === categoryParam);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 1. Header & Active Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <span>Products</span>
            {categoryParam && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-semibold">{activeCategoryObj?.name || categoryParam}</span>
              </>
            )}
            {searchParam && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-semibold">Search: &ldquo;{searchParam}&rdquo;</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center space-x-3">
            <span>
              {searchParam
                ? `Search results for "${searchParam}"`
                : activeCategoryObj
                ? activeCategoryObj.name
                : 'All Supermarket Products'}
            </span>
            <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-bold">
              {totalProducts} items
            </span>
          </h1>
        </div>

        {/* Sort selector & Mobile filter toggle */}
        <div className="flex items-center space-x-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center space-x-2 px-3.5 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 hidden sm:inline font-medium">Sort by:</span>
            <select
              value={sortParam}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="text-xs font-bold bg-white border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 shadow-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 font-bold text-sm text-gray-900">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filters</span>
            </div>
            {(categoryParam || searchParam || subcategoryParam || minPriceParam || maxPriceParam || inStockParam) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Categories
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => updateFilters({ category: '', subcategory: '' })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  !categoryParam
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>All Categories</span>
                <span>{categories.reduce((acc, c) => acc + (c.itemCount || 0), 0)}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    categoryParam === cat.slug
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-gray-400 font-normal ml-2">
                    {cat.itemCount || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories (if category active) */}
          {activeCategoryObj?.subcategories?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Subcategories
              </h3>
              <div className="space-y-1">
                {activeCategoryObj.subcategories.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      updateFilters({
                        subcategory: subcategoryParam === sub ? '' : sub,
                      })
                    }
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      subcategoryParam === sub
                        ? 'bg-emerald-100 text-emerald-900 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{sub}</span>
                    {subcategoryParam === sub && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Filter */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Price Range (₹)
            </h3>
            <form onSubmit={handlePriceApply} className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Apply Price
              </button>
            </form>
          </div>

          {/* Stock Availability */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Availability
            </h3>
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-gray-700 select-none">
              <input
                type="checkbox"
                checked={inStockParam}
                onChange={(e) => updateFilters({ inStock: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>In-Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900">
                No matching groceries found
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                We couldn&apos;t find any grocery items matching your current search query or filter combination. Try resetting your filters or search with another keyword.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors inline-flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => updateFilters({ page: Math.max(1, pageParam - 1) })}
                    disabled={pageParam <= 1}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    &larr; Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateFilters({ page: idx + 1 })}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        pageParam === idx + 1
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => updateFilters({ page: Math.min(totalPages, pageParam + 1) })}
                    disabled={pageParam >= totalPages}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 lg:hidden animate-fade-in">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-base">Filter Groceries</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Categories
              </h4>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => {
                      handleCategorySelect(cat.slug);
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs font-semibold ${
                      categoryParam === cat.slug ? 'bg-emerald-100 text-emerald-900' : 'text-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl mb-2"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Apply &amp; View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;

