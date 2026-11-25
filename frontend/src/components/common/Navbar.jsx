import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  MapPin,
  Heart,
  User,
  ChevronDown,
  Menu,
  X,
  Tag,
  ShieldCheck,
  Clock,
  Sparkles,
  LogOut,
  Package,
  Layers,
  LayoutDashboard,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { productAPI, categoryAPI } from '../../services/api';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, wishlist, openAuthModal } = useAuth();
  const { itemCount, subtotal } = useCart();
  const { currentLocation, setIsLocationModalOpen } = useLocation();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // BigBasket-Style Sticky Search & Header Scroll State
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const lastScrollY = useRef(0);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const categoriesRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 70) {
        setIsScrolled(true);
        if (currentScrollY > lastScrollY.current + 6) {
          setScrollDirection('down');
        } else if (currentScrollY < lastScrollY.current - 6) {
          setScrollDirection('up');
        }
      } else {
        setIsScrolled(false);
        setScrollDirection('up');
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load categories for mega-bar
  useEffect(() => {
    categoryAPI
      .getCategories()
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.warn('Could not load navbar categories:', err));
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ products: [], categories: [] });
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await productAPI.getSuggestions(searchQuery.trim());
        if (res.success && res.data) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setCategoriesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSuggestions(false);
    setUserMenuOpen(false);
    setCategoriesDropdownOpen(false);
  }, [routerLocation.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (url) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(url);
  };

  // Cart Button Click Interception:
  // If guest clicks Cart icon, show login popup before allowing checkout.
  // If authenticated, open cart directly.
  const handleCartClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('otp', '/cart');
    } else {
      navigate('/cart');
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-all duration-300 ${
        isScrolled
          ? 'shadow-md border-b border-gray-200/90'
          : 'shadow-xs border-b border-gray-100'
      }`}
    >
      {/* 1. Top Announcement Bar (Tucks away when scrolled down) */}
      <div
        className={`bg-emerald-800 text-white text-xs py-1.5 px-4 transition-all duration-300 overflow-hidden ${
          isScrolled && scrollDirection === 'down' ? 'max-h-0 py-0 opacity-0' : 'max-h-10 opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/offers" className="flex items-center space-x-1.5 font-medium hover:underline">
              <Tag className="w-3.5 h-3.5 text-yellow-300" />
              <span>
                Use code <strong className="text-yellow-300">BEE50</strong> for ₹50 off &bull; View Offers &rarr;
              </span>
            </Link>
            <span className="hidden md:inline text-emerald-400">|</span>
            <span className="hidden md:flex items-center space-x-1 text-emerald-100 font-medium">
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>⚡ 10-Minute Express Delivery Available in Lucknow</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="hidden sm:flex items-center space-x-1 text-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>100% Quality Guaranteed</span>
            </span>
            {isAdmin && (
              <Link
                to="/admin"
                className="bg-yellow-400 text-gray-950 font-bold px-2 py-0.5 rounded-full hover:bg-yellow-300 transition-colors flex items-center space-x-1 shadow-xs"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-600 hover:text-emerald-700 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo - BasketBee */}
        <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
            <span className="text-xl">🐝</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-emerald-950 leading-none">
              Basket<span className="text-emerald-600">Bee</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase font-bold text-gray-400 mt-0.5">
              Supermarket
            </span>
          </div>
        </Link>

        {/* Delivery Location Selector */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:border-emerald-600 hover:bg-emerald-100/50 text-left transition-all max-w-[210px] shadow-xs"
          title="Select delivery location"
        >
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate text-xs">
            <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center space-x-1">
              <span>Delivering to</span>
              {currentLocation?.isServiceable !== false && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
              )}
            </div>
            <div className="font-bold text-gray-900 truncate">
              {currentLocation?.area || currentLocation?.city || 'Lucknow'}{' '}
              <span className="text-gray-500 font-mono font-normal">
                ({currentLocation?.pincode || '226016'})
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>

        {/* BigBasket-Style Search Bar with Autocomplete */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              placeholder="Search 10,000+ groceries, fruits, veggies, milk, snacks..."
              className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
              {/* Category matches */}
              {suggestions.categories?.length > 0 && (
                <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                    Matching Categories
                  </div>
                  {suggestions.categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => handleSuggestionClick(`/products?category=${cat.slug}`)}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center justify-between"
                    >
                      <span>
                        In category: <strong>{cat.name}</strong>
                      </span>
                      <span className="text-[10px] text-gray-400">View all &rarr;</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product matches */}
              <div className="p-2 max-h-80 overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                  Products
                </div>
                {suggestions.products.map((prod) => (
                  <button
                    key={prod._id}
                    onClick={() => handleSuggestionClick(`/product/${prod.slug}`)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors group"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate group-hover:text-emerald-700">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {prod.unit} &bull;{' '}
                        <span className="text-emerald-700 font-bold">
                          ₹{prod.sellingPrice ?? prod.discountedPrice}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* View all results button */}
              <button
                onClick={handleSearchSubmit}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold text-center border-t border-emerald-100 transition-colors"
              >
                View all results for &ldquo;{searchQuery}&rdquo; &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Wishlist, User Menu, Cart */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2 text-gray-600 hover:text-emerald-700 hover:bg-gray-100 rounded-xl transition-colors hidden sm:flex items-center"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* User Account Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-2 text-gray-700 hover:text-emerald-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-semibold"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {isAuthenticated ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <span className="hidden md:inline truncate max-w-[100px]">
                {isAuthenticated ? user.name.split(' ')[0] : 'Sign In'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in text-sm">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/60">
                      <div className="font-bold text-gray-900 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email || user.phone}</div>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {user.role}
                      </span>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-emerald-800 font-semibold hover:bg-emerald-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>My Orders</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setIsLocationModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>My Addresses</span>
                    </button>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span>My Wishlist ({wishlist.length})</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Sign in as Customer to order groceries, or as Admin to manage the store.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        openAuthModal('otp');
                      }}
                      className="block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center text-xs shadow-sm transition-colors"
                    >
                      Customer Login (Mobile OTP)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        openAuthModal('register');
                      }}
                      className="block w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-center text-xs transition-colors"
                    >
                      Sign Up with Gmail
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="block w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-center text-xs transition-colors"
                    >
                      Admin Login (Email &amp; Password)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon & Live Amount (Interception: If guest, prompt OTP login popup before proceeding!) */}
          <button
            onClick={handleCartClick}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-200 transition-all font-semibold text-xs sm:text-sm group"
            title={isAuthenticated ? 'Open Shopping Basket' : 'Sign in to access Basket'}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-emerald-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="font-extrabold text-xs">₹{subtotal}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Bottom Category Mega-Menu Bar */}
      <div className="hidden lg:block border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold text-gray-700">
          {/* Mega Menu Dropdown */}
          <div ref={categoriesRef} className="relative">
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="flex items-center space-x-2 py-2.5 px-3 hover:text-emerald-700 hover:bg-emerald-50 rounded-t-lg transition-colors font-bold text-gray-900 border-r border-gray-100"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>SHOP BY CATEGORY</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {categoriesDropdownOpen && (
              <div className="absolute top-full left-0 w-72 bg-white rounded-b-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in max-h-96 overflow-y-auto">
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products?category=${cat.slug}`}
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {cat.itemCount ? `${cat.itemCount} items` : ''}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct Category Links (First 7) */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1.5">
            {categories.slice(0, 7).map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="px-2.5 py-1 rounded-lg hover:bg-gray-100 hover:text-emerald-700 whitespace-nowrap transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              to="/offers"
              className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-100/70 font-bold hover:bg-emerald-200 whitespace-nowrap transition-colors flex items-center space-x-1"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Offers</span>
            </Link>
            <Link
              to="/products?isTrending=true"
              className="px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 font-bold hover:bg-emerald-100 whitespace-nowrap transition-colors flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trending</span>
            </Link>
          </div>

          {/* Quick link */}
          <Link
            to="/products"
            className="text-emerald-700 font-bold hover:underline whitespace-nowrap"
          >
            All Products &rarr;
          </Link>
        </div>
      </div>

      {/* 4. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3 animate-fade-in max-h-[80vh] overflow-y-auto">
          {/* Mobile Location Selector */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsLocationModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
          >
            <div className="flex items-center space-x-2 text-gray-800">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                Deliver to: {currentLocation.city || 'Lucknow'} ({currentLocation.pincode || '226016'})
              </span>
            </div>
            <span className="text-emerald-700 font-bold">Change</span>
          </button>

          {/* Category List */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Browse Categories
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 font-medium border border-gray-100 transition-colors truncate"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-around text-xs font-semibold">
            <Link to="/products" className="text-gray-700 hover:text-emerald-700">
              All Products
            </Link>
            <Link to="/wishlist" className="text-gray-700 hover:text-emerald-700">
              Wishlist ({wishlist.length})
            </Link>
            {isAuthenticated ? (
              <Link to="/orders" className="text-gray-700 hover:text-emerald-700">
                My Orders
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('otp');
                }}
                className="text-emerald-700 font-bold"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
