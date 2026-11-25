import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-5">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-gray-800">Aisle Not Found</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          The page or supermarket aisle you requested could not be located. Head back to the store front to browse fresh produce.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <span>Back to BasketBee Supermarket</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

