import React, { useState } from 'react';
import { Tag, Copy, Check, ArrowRight, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const PROMOTIONAL_OFFERS_DATA = [
  {
    id: 'bee50',
    code: 'BEE50',
    title: 'Flat ₹50 Super Savings',
    discount: 'FLAT ₹50 OFF',
    discountAmount: 50,
    minOrderValue: 499,
    description: 'Get ₹50 OFF on all fresh grocery orders above ₹499.',
    validity: 'Valid through 2026',
    tag: 'MOST POPULAR',
    bgAccent: 'from-emerald-500 to-green-600',
  },
  {
    id: 'bee100',
    code: 'BEE100',
    title: 'Mega Basket Bonanza',
    discount: 'FLAT ₹100 OFF',
    discountAmount: 100,
    minOrderValue: 999,
    description: 'Get ₹100 OFF on pantry and family grocery orders above ₹999.',
    validity: 'Valid through 2026',
    tag: 'BIG BASKET SAVINGS',
    bgAccent: 'from-teal-600 to-emerald-700',
  },
  {
    id: 'bee20',
    code: 'BEE20',
    title: '20% Smart Grocery Discount',
    discount: '20% OFF (UP TO ₹150)',
    discountAmount: 'Up to ₹150',
    minOrderValue: 699,
    description: 'Get 20% OFF on eligible orders above ₹699, maximum discount ₹150.',
    validity: 'Valid through 2026',
    tag: 'WEEKLY SPECIAL',
    bgAccent: 'from-green-600 to-emerald-800',
  },
  {
    id: 'freeship',
    code: 'FREESHIP',
    title: 'Zero Delivery Fee Pass',
    discount: 'FREE DELIVERY',
    discountAmount: 'Save ₹25',
    minOrderValue: 299,
    description: 'Enjoy free doorstep delivery on eligible orders above ₹299.',
    validity: 'Valid through 2026',
    tag: 'ZERO SHIPPING',
    bgAccent: 'from-emerald-700 to-teal-800',
  },
];

const PromotionalOffersSection = ({ title = 'Exclusive Promotional Offers & Bank Deals', subtitle = 'Save extra on every order with authentic BasketBee promo codes' }) => {
  const { applyCouponCode, coupon, subtotal } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info(`Promo code '${code}' copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleApply = async (code) => {
    const res = await applyCouponCode(code);
    if (res?.success) {
      navigate('/cart');
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Tag className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Grid of Promotional Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {PROMOTIONAL_OFFERS_DATA.map((offer) => {
          const isApplied = coupon?.code === offer.code;
          const isCopied = copiedCode === offer.code;

          return (
            <div
              key={offer.id}
              className="group relative bg-white rounded-3xl border border-gray-200/90 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden p-5"
            >
              {/* Top Accent Strip with Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {offer.tag}
                </span>
                <span className="text-[10px] text-gray-400 font-medium flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{offer.validity}</span>
                </span>
              </div>

              {/* Offer Heading & Discount */}
              <div className="space-y-2 mb-4">
                <div className="text-lg font-black text-emerald-950 leading-snug">
                  {offer.discount}
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  {offer.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {offer.description}
                </p>
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                  Min. Order Value: <span className="text-emerald-950 font-black">₹{offer.minOrderValue}</span>
                </div>
              </div>

              {/* Promo Code & Action Buttons */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                {/* Code Pill with Copy */}
                <div className="flex items-center justify-between bg-gray-50 border border-dashed border-emerald-500/80 rounded-2xl p-2 px-3">
                  <div className="font-mono text-sm font-black text-emerald-950 tracking-wider">
                    {offer.code}
                  </div>
                  <button
                    onClick={() => handleCopy(offer.code)}
                    className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors p-1"
                    title="Copy promo code"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Apply Offer Button */}
                {isApplied ? (
                  <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center border border-emerald-300 flex items-center justify-center space-x-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Applied to Basket</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(offer.code)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center space-x-1.5"
                  >
                    <span>Apply Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PromotionalOffersSection;

