import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
  Sparkles,
  CheckCircle2,
  X,
  Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { getProductImageUrl, isPackagedProduct, FALLBACK_IMAGE } from '../utils/productImages';

const PROMOTIONAL_OFFERS = [
  {
    code: 'BEE50',
    title: 'Flat ₹50 OFF',
    desc: 'Get ₹50 OFF on orders above ₹499',
    min: 499,
    discountDisplay: '₹50 OFF',
  },
  {
    code: 'BEE100',
    title: 'Flat ₹100 OFF',
    desc: 'Get ₹100 OFF on orders above ₹999',
    min: 999,
    discountDisplay: '₹100 OFF',
  },
  {
    code: 'BEE20',
    title: '20% Super Savings',
    desc: 'Get 20% OFF on orders above ₹699, max discount ₹150',
    min: 699,
    discountDisplay: '20% OFF',
  },
  {
    code: 'FREESHIP',
    title: 'Free Delivery',
    desc: 'Free delivery on eligible orders above ₹299',
    min: 299,
    discountDisplay: 'FREE SHIP',
  },
];

const CartPage = () => {
  const {
    items,
    itemCount,
    totalMRP,
    subtotal,
    productSavings,
    deliveryFee,
    coupon,
    couponDiscount,
    couponSavings,
    totalAmount,
    totalSavings,
    isFreeDeliveryEligible,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCouponCode,
    removeCoupon,
  } = useCart();

  const { isAuthenticated, openAuthModal } = useAuth();
  const { currentLocation } = useLocation();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  const handleApplyPromo = async (codeToApply) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) return;
    setApplyingPromo(true);
    await applyCouponCode(code);
    setApplyingPromo(false);
    setPromoInput('');
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      openAuthModal('otp', '/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const amountNeededForFreeDelivery = Math.max(0, 499 - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / 499) * 100));

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Your Shopping Basket is Empty
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Your grocery basket feels light! Explore our farm-fresh vegetables, dairy, staples, and exciting daily offers to fill it up.
          </p>
        </div>
        <div>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            <span>Start Shopping Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            My Grocery Basket ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-2">
            <span>
              Delivering to: <strong className="text-gray-800">{currentLocation.area ? `${currentLocation.area}, ` : ''}{currentLocation.city} ({currentLocation.pincode})</strong>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentLocation.isServiceable !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {currentLocation.isServiceable !== false ? '✓ Serviceable' : '✕ Not Serviceable'}
            </span>
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>Empty Entire Basket</span>
        </button>
      </div>

      {/* 2. Free Delivery Threshold Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            {isFreeDeliveryEligible || amountNeededForFreeDelivery === 0 ? (
              <div className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Congratulations! You qualify for <strong>FREE Doorstep Delivery</strong>!</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-semibold text-emerald-900">
                Add <strong>₹{amountNeededForFreeDelivery}</strong> more to get <strong>FREE Delivery</strong> (Free on orders ₹499+)
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full sm:w-48 bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${isFreeDeliveryEligible ? 100 : freeDeliveryProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const prod = item.product || {};
            const sellingPrice = Number(prod.sellingPrice ?? prod.discountedPrice ?? item.price ?? 0);
            const mrp = Number(prod.mrp ?? prod.originalPrice ?? sellingPrice);
            const itemTotal = sellingPrice * item.quantity;
            const itemSavings = (mrp - sellingPrice) * item.quantity;

            const imageUrl = getProductImageUrl(prod);
            const packaged = isPackagedProduct(prod);

            return (
              <div
                key={prod._id || item._id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-emerald-300"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <Link
                    to={`/product/${prod.slug}`}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50/70 border border-gray-100 flex-shrink-0 flex items-center justify-center p-1.5"
                  >
                    <img
                      src={imageUrl}
                      alt={prod.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      className={`w-full h-full ${
                        packaged ? 'object-contain p-1' : 'object-cover'
                      } rounded-lg`}
                    />
                  </Link>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {prod.brand || 'BasketBee'}
                    </span>
                    <Link
                      to={`/product/${prod.slug}`}
                      className="block text-sm font-bold text-gray-900 hover:text-emerald-700 truncate max-w-xs"
                    >
                      {prod.name}
                    </Link>
                    <div className="text-xs text-gray-500">
                      Pack: <span className="font-semibold text-gray-700">{prod.weight || prod.unit || item.unit}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-black text-emerald-950">₹{sellingPrice}</span>
                      {mrp > sellingPrice && (
                        <span className="text-gray-400 line-through">MRP: ₹{mrp}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BigBasket Quantity Stepper & Subtotal */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-8">
                  {/* Stepper */}
                  <div className="flex items-center space-x-2 bg-white border-2 border-emerald-600 rounded-xl px-2.5 py-1">
                    <button
                      onClick={() => updateQuantity(prod._id, item.quantity - 1)}
                      className="p-1 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black text-emerald-950 w-5 text-center select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(prod._id, item.quantity + 1)}
                      disabled={prod.stock && item.quantity >= prod.stock}
                      className="p-1 hover:bg-emerald-50 disabled:opacity-40 rounded-lg text-emerald-700 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line total & remove */}
                  <div className="text-right">
                    <div className="text-base font-black text-gray-900">
                      ₹{itemTotal}
                    </div>
                    {itemSavings > 0 && (
                      <div className="text-[10px] font-bold text-green-700">
                        Saved ₹{itemSavings}
                      </div>
                    )}
                    <button
                      onClick={() => removeFromCart(prod._id)}
                      className="text-gray-400 hover:text-red-600 text-xs mt-1 transition-colors flex items-center space-x-1 ml-auto"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              to="/products"
              className="text-emerald-700 font-bold text-xs hover:underline inline-flex items-center space-x-1"
            >
              <span>&larr; Add more items from aisles</span>
            </Link>
          </div>
        </div>

        {/* Right: Order Bill Summary & Coupon Code Section */}
        <div className="space-y-6">
          {/* 1. Apply Coupon Section */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-sm font-black text-gray-900">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Apply Coupon</span>
            </div>

            {coupon ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-950 font-mono tracking-wider">
                      {coupon.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    {coupon.description || `Saved ₹${couponSavings} with this offer`}
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter promo code (e.g. FRESH50)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    className="flex-1 px-3.5 py-2.5 text-xs uppercase font-mono bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                  <button
                    onClick={() => handleApplyPromo()}
                    disabled={!promoInput.trim() || applyingPromo}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-colors shadow-sm active:scale-95"
                  >
                    {applyingPromo ? '...' : 'APPLY'}
                  </button>
                </div>

                {/* Available Offers List */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Available Offers
                  </div>
                  {PROMOTIONAL_OFFERS.map((offer) => {
                    const isApplicable = subtotal >= offer.min;
                    const isCurrent = coupon?.code === offer.code;

                    return (
                      <div
                        key={offer.code}
                        className={`p-3 rounded-2xl border transition-all text-left ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                            : 'border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-emerald-800 font-mono bg-emerald-100 px-2 py-0.5 rounded-lg">
                              {offer.code}
                            </span>
                            <span className="text-[11px] font-bold text-gray-700">
                              {offer.title}
                            </span>
                          </div>
                          {isCurrent ? (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApplyPromo(offer.code)}
                              className={`text-xs font-black px-2.5 py-1 rounded-lg transition-colors ${
                                isApplicable
                                  ? 'text-emerald-700 hover:bg-emerald-100'
                                  : 'text-gray-400 hover:text-emerald-700'
                              }`}
                            >
                              APPLY
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {offer.desc}
                        </div>
                        {!isApplicable && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Add items worth ₹{offer.min - subtotal} more to unlock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Professional Commercial Grocery Bill Summary */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Bill Summary
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600">
              {/* Total MRP */}
              <div className="flex justify-between items-center">
                <span>MRP Total</span>
                <span className="font-semibold text-gray-800">₹{totalMRP}</span>
              </div>

              {/* Product Discount */}
              {productSavings > 0 && (
                <div className="flex justify-between items-center text-green-700 font-semibold">
                  <span>Product Discount</span>
                  <span>- ₹{productSavings}</span>
                </div>
              )}

              {/* Subtotal After Product Discounts */}
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="font-bold text-gray-900">Subtotal After Product Discounts</span>
                <span className="font-bold text-gray-900">₹{subtotal}</span>
              </div>

              {/* Coupon Savings */}
              {coupon && couponSavings > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Coupon ({coupon.code})</span>
                  <span>- ₹{couponSavings}</span>
                </div>
              )}

              {/* Delivery Charges */}
              <div className="flex justify-between items-center">
                <span>Delivery Charges</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-black text-green-700 uppercase">FREE</span>
                  ) : (
                    <span className="font-bold text-gray-900">₹{deliveryFee}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Final Bill / Total Payable */}
            <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-baseline">
              <div className="flex flex-col">
                <span className="text-base font-black text-gray-900">Final Bill</span>
                <span className="text-[10px] text-gray-400">Inclusive of all applicable taxes</span>
              </div>
              <span className="text-2xl font-black text-emerald-950">
                ₹{totalAmount}
              </span>
            </div>

            {/* High-Impact Total Savings Banner (Product Savings + Coupon Savings) */}
            {totalSavings > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center shadow-md shadow-emerald-200 space-y-0.5 animate-fade-in">
                <div className="flex items-center justify-center space-x-1.5 text-xs font-black uppercase tracking-wider text-yellow-200">
                  <Sparkles className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  <span>Congratulations!</span>
                </div>
                <div className="text-sm font-extrabold">
                  You saved ₹{totalSavings} on this order!
                </div>
                <div className="text-[10px] text-emerald-100 opacity-90">
                  (₹{productSavings} product discounts + ₹{couponSavings} coupon savings)
                </div>
              </div>
            )}

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 transition-all flex items-center justify-center space-x-2 active:scale-95 tracking-wide"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-1 text-center text-[11px] text-gray-400 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe &amp; Secure 256-Bit SSL Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
