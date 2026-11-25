import React from 'react';
import { Tag, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PromotionalOffersSection from '../components/common/PromotionalOffersSection';

const OffersPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase text-yellow-300">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>EXCLUSIVE PROMOTIONS &amp; VOUCHERS</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Fresh Savings, Every Single Day
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
            Apply verified BasketBee promo codes at checkout to unlock instant discounts, free doorstep delivery, and extra savings on pantry staples.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Tag className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Promotional Offers Grid */}
      <PromotionalOffersSection
        title="Active Supermarket Coupons"
        subtitle="Click 'Apply Offer' to activate or copy code for checkout"
      />

      {/* Quick Terms & Trust Banner */}
      <div className="p-6 bg-white rounded-3xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-gray-800">100% Guaranteed Genuine Coupons</span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Coupons are validated automatically by the BasketBee server. Limit 1 coupon per order.
            </p>
          </div>
        </div>
        <Link
          to="/products"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center space-x-1 flex-shrink-0"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default OffersPage;

