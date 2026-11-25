import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  BadgePercent,
  Phone,
  Mail,
  MapPin,
  Heart,
  Zap,
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-emerald-950 text-emerald-100 pt-12 pb-8 border-t border-emerald-900 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* 1. Value Proposition Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-emerald-900/60">
          <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">10-Min Express</h4>
              <p className="text-xs text-emerald-300">Fast doorstep grocery delivery</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Quality</h4>
              <p className="text-xs text-emerald-300">Farm fresh &amp; quality audited</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
              <BadgePercent className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Best Prices &amp; Deals</h4>
              <p className="text-xs text-emerald-300">Cheaper than local supermarkets</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">No-Questions Return</h4>
              <p className="text-xs text-emerald-300">Doorstep return &amp; refund</p>
            </div>
          </div>
        </div>

        {/* 2. Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-10 border-b border-emerald-900/60">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-md">
                <span className="text-xl">🐝</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Basket<span className="text-emerald-400">Bee</span>
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed pr-6">
              BasketBee is your daily online grocery partner committed to delivering pure, farm-fresh fruits, crisp vegetables, chilled dairy, pantry staples, and household essentials straight to your home in 10-15 minutes.
            </p>
            <div className="space-y-2 text-xs text-emerald-300">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Express Hub: Hazratganj &amp; Gomti Nagar, Lucknow, UP 226016</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Customer Support: +91 1800-BASKET-BEE (Toll-Free, 6 AM – 11 PM)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@basketbee.com</span>
              </div>
            </div>
          </div>

          {/* Popular Aisles */}
          <div>
            <h5 className="text-white font-bold text-sm mb-3">Popular Aisles</h5>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li>
                <Link to="/products?category=fruits-vegetables" className="hover:text-emerald-400 transition-colors">
                  Fruits &amp; Vegetables
                </Link>
              </li>
              <li>
                <Link to="/products?category=dairy-bread-eggs" className="hover:text-emerald-400 transition-colors">
                  Dairy, Bread &amp; Eggs
                </Link>
              </li>
              <li>
                <Link to="/products?category=rice-atta-dal" className="hover:text-emerald-400 transition-colors">
                  Rice, Atta &amp; Dal
                </Link>
              </li>
              <li>
                <Link to="/products?category=snacks-munchies" className="hover:text-emerald-400 transition-colors">
                  Snacks &amp; Munchies
                </Link>
              </li>
              <li>
                <Link to="/products?category=cold-drinks-juices" className="hover:text-emerald-400 transition-colors">
                  Cold Drinks &amp; Juices
                </Link>
              </li>
              <li>
                <Link to="/products?category=cleaning-household" className="hover:text-emerald-400 transition-colors">
                  Cleaning &amp; Household
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-bold text-sm mb-3">Customer Care</h5>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li>
                <Link to="/orders" className="hover:text-emerald-400 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-emerald-400 transition-colors">
                  Delivery Addresses
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-emerald-400 transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-emerald-400 transition-colors">
                  Coupons &amp; Offers
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-emerald-400 transition-colors">
                  Shopping Basket
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Partners & Security */}
          <div>
            <h5 className="text-white font-bold text-sm mb-3">Safe &amp; Secure Payment</h5>
            <p className="text-xs text-emerald-300 mb-3 leading-relaxed">
              We support 256-bit encrypted transactions via Stripe Checkout, Visa, Mastercard, UPI, RuPay, and Cash on Delivery.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="px-2.5 py-1 rounded bg-white text-emerald-950">STRIPE</span>
              <span className="px-2.5 py-1 rounded bg-white text-blue-900">VISA</span>
              <span className="px-2.5 py-1 rounded bg-white text-red-600">MASTERCARD</span>
              <span className="px-2.5 py-1 rounded bg-white text-green-700">UPI</span>
              <span className="px-2.5 py-1 rounded bg-emerald-800 text-yellow-300">CASH ON DELIVERY</span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400">
          <div>
            &copy; {new Date().getFullYear()} BasketBee Supermarket Technologies Pvt Ltd. All rights reserved.
          </div>
          <div className="flex items-center space-x-1 mt-3 sm:mt-0">
            <span>Built with passion &amp;</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
            <span>for healthy homes.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
