import React from 'react';

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="w-full aspect-square bg-gray-200 rounded-xl mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-3 w-20 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="h-5 w-16 bg-gray-200 rounded"></div>
        <div className="h-8 w-16 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
};

export const CategorySkeleton = () => {
  return (
    <div className="flex flex-col items-center space-y-2 p-3 bg-white rounded-2xl border border-gray-100 animate-pulse">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full"></div>
      <div className="h-3 w-16 bg-gray-200 rounded"></div>
    </div>
  );
};

