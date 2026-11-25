import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Percent,
  ChevronLeft,
  ChevronRight,
  Send,
  ShoppingBag,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import PromotionalOffersSection from '../components/common/PromotionalOffersSection';
import { ProductCardSkeleton, CategorySkeleton } from '../components/common/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'Farm Fresh Organic Harvest',
    subtitle: 'Crisp green veggies & luscious fruits delivered straight from local farms to your doorstep in 10-15 minutes.',
    discount: 'UP TO 35% OFF',
    buttonText: 'Shop Fresh Harvest',
    link: '/products?category=fruits-vegetables',
    bgGradient: 'from-emerald-900 via-emerald-800 to-green-900',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80',
    tag: 'FARM DIRECT',
  },
  {
    id: 2,
    title: 'Daily Dairy, Bread & Eggs',
    subtitle: 'Pure wholesome milk, malai paneer, farm eggs, and oven-fresh bakery items for your morning kickstart.',
    discount: 'FLAT 20% OFF',
    buttonText: 'Order Morning Dairy',
    link: '/products?category=dairy-bread-eggs',
    bgGradient: 'from-amber-900 via-stone-900 to-emerald-950',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80',
    tag: 'MORNING ESSENTIALS',
  },
  {
    id: 3,
    title: 'Pantry Staples & Pulses',
    subtitle: 'Royal basmati rice, chakki fresh wheat atta, unpolished high-protein dals and pure cooking oils.',
    discount: 'SAVE UP TO ₹300',
    buttonText: 'Stock Up Kitchen',
    link: '/products?category=rice-atta-dal',
    bgGradient: 'from-emerald-950 via-teal-900 to-green-950',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
    tag: 'PANTRY SUPER SAVINGS',
  },
];

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(false);
  const [featuredData, setFeaturedData] = useState({
    bestSellers: [],
    trending: [],
    freshPicks: [],
    discounts: [],
  });
  const [dairyProducts, setDairyProducts] = useState([]);
  const [snacksProducts, setSnacksProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      setCategoryError(false);
      const res = await categoryAPI.getCategories();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      } else {
        setCategoryError(true);
      }
    } catch (err) {
      console.warn('Category fetch error:', err);
      setCategoryError(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        categoryAPI.getCategories(),
        productAPI.getFeatured(),
        productAPI.getProducts({ category: 'dairy-bread-eggs', limit: 4 }),
        productAPI.getProducts({ category: 'snacks-munchies', limit: 4 }),
        productAPI.getProducts({ sort: 'newest', limit: 4 }),
      ]);

      // 1. Categories
      if (results[0].status === 'fulfilled' && results[0].value?.success) {
        setCategories(results[0].value.data || []);
      } else {
        setCategoryError(true);
      }

      // 2. Featured
      if (results[1].status === 'fulfilled' && results[1].value?.success) {
        setFeaturedData(results[1].value.data || {});
      }

      // 3. Dairy products
      if (results[2].status === 'fulfilled' && results[2].value?.success) {
        setDairyProducts(results[2].value.data || []);
      }

      // 4. Snacks products
      if (results[3].status === 'fulfilled' && results[3].value?.success) {
        setSnacksProducts(results[3].value.data || []);
      }

      // 5. Recent arrivals
      if (results[4].status === 'fulfilled' && results[4].value?.success) {
        setRecentProducts(results[4].value.data || []);
      }
    } catch (err) {
      console.error('Error loading homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hero carousel auto-timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      setNewsletterSuccess(true);
      toast.success('Thank you for subscribing! Promo code BEE50 sent to your inbox.');
      setNewsletterEmail('');
    } else {
      toast.error('Please enter a valid email address');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Promotional Banner Carousel */}
      <section className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-4 shadow-xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className={`min-w-full relative flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 lg:p-16 bg-gradient-to-r ${slide.bgGradient} text-white min-h-[380px] sm:min-h-[420px]`}
            >
              {/* Text content */}
              <div className="z-10 max-w-xl space-y-4 text-center md:text-left">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase text-yellow-300">
                  {slide.tag} &bull; {slide.discount}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-lg">
                  {slide.subtitle}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    to={slide.link}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-emerald-200 font-semibold flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    <span>⚡ Guaranteed delivery in 10-15 mins</span>
                  </span>
                </div>
              </div>

              {/* Graphic/Image */}
              <div className="mt-6 md:mt-0 relative w-full md:w-1/2 flex items-center justify-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 transform rotate-1 group-hover:rotate-0 transition-transform">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-emerald-950 text-xs font-bold shadow">
                    BasketBee Assured Quality
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel controls */}
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/60 text-white flex items-center justify-center transition-all shadow"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/60 text-white flex items-center justify-center transition-all shadow"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx ? 'w-6 bg-yellow-400' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. Shop By Category Section (BigBasket-Inspired 14 Departments Grid) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Explore freshly categorized departments across 10,000+ grocery essentials
            </p>
          </div>
          <Link
            to="/products"
            className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-1"
          >
            <span>View All Aisles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : categoryError && categories.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <p className="text-sm font-semibold text-gray-600">
              Unable to load supermarket categories at the moment.
            </p>
            <button
              onClick={fetchCategories}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading Categories</span>
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500">No categories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center p-3 bg-white hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-400 rounded-2xl transition-all duration-300 hover:shadow-lg text-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden mb-2.5 bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform duration-300 shadow-xs flex items-center justify-center">
                  <img
                    src={cat.imageUrl || cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 line-clamp-2 leading-tight">
                  {cat.name}
                </span>
                {typeof cat.itemCount === 'number' && cat.itemCount > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full mt-1.5">
                    {cat.itemCount} items
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3. Promotional Offers & Coupon Codes Component */}
      <PromotionalOffersSection />

      {/* 4. Best Sellers Products */}
      {featuredData.bestSellers?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Customer Favourites &amp; Best Sellers
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Most frequently added to basket across Lucknow
                </p>
              </div>
            </div>
            <Link
              to="/products?isBestSeller=true"
              className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-1"
            >
              <span>See All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredData.bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Trending Deals */}
      {featuredData.trending?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Trending Grocery Deals
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Popular items ordered this week at discounted prices
                </p>
              </div>
            </div>
            <Link
              to="/products?isTrending=true"
              className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-1"
            >
              <span>View More</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredData.trending.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Fresh Dairy & Bakery Highlights */}
      {dairyProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Daily Dairy, Bread &amp; Eggs
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Chilled milk, unsalted butter, malai paneer &amp; farm eggs
              </p>
            </div>
            <Link
              to="/products?category=dairy-bread-eggs"
              className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-1"
            >
              <span>View Dairy Aisle</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {dairyProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Snacks & Munchies Highlights */}
      {snacksProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Evening Snacks &amp; Munchies
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Crispy potato chips, Indian namkeens &amp; evening tea snacks
              </p>
            </div>
            <Link
              to="/products?category=snacks-munchies"
              className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-1"
            >
              <span>View Snacks Aisle</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {snacksProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 8. Recent Arrivals */}
      {recentProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Recently Added &amp; New Arrivals
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  New season organic harvest and freshly stocked items
                </p>
              </div>
            </div>
            <Link
              to="/products?sort=newest"
              className="text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold flex items-center space-x-1"
            >
              <span>Explore New Arrivals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Promotional Dual Banners */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-100/60 border border-emerald-200 flex flex-col justify-between space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full w-max flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700" />
            <span>⚡ 10-MINUTE EXPRESS DELIVERY</span>
          </span>
          <div>
            <h3 className="text-2xl font-black text-emerald-950">
              Need Groceries in a Flash?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800/80 mt-1">
              Select our 10-Minute Express Delivery at checkout and receive milk, bread, snacks, and fruits within 10 to 15 minutes!
            </p>
          </div>
          <Link
            to="/products"
            className="text-emerald-900 font-bold text-sm hover:underline flex items-center space-x-1"
          >
            <span>Order Express Delivery Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col justify-between space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-3 py-1 rounded-full w-max">
            🎁 FIRST ORDER SPECIAL
          </span>
          <div>
            <h3 className="text-2xl font-black text-amber-950">
              Get ₹50 OFF Your First Basket
            </h3>
            <p className="text-xs sm:text-sm text-amber-800/80 mt-1">
              Apply coupon voucher code <strong className="text-amber-900 underline">BEE50</strong> on orders above ₹499 at checkout.
            </p>
          </div>
          <Link
            to="/products"
            className="text-amber-900 font-bold text-sm hover:underline flex items-center space-x-1"
          >
            <span>Start Shopping With BEE50</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 10. Newsletter Subscription */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-lg space-y-2 text-center md:text-left">
            <span className="text-yellow-300 font-bold text-xs uppercase tracking-wider">
              FRESH DISCOUNTS &amp; WEEKLY COUPONS
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Subscribe to BasketBee Deals
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
              Get secret weekly coupon codes, seasonal organic harvest updates, and special discounts sent directly to your inbox.
            </p>
          </div>

          <form onSubmit={handleNewsletter} className="w-full md:w-auto flex-1 max-w-md">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200/60 text-sm focus:outline-none focus:bg-white/20 transition-all"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black rounded-xl text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <span>Subscribe</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
            {newsletterSuccess && (
              <p className="text-xs text-yellow-300 mt-2 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Subscribed! Check your inbox for your welcome coupon.</span>
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
