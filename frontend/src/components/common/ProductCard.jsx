import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Minus, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getProductImageUrl, isPackagedProduct, FALLBACK_IMAGE } from '../../utils/productImages';

const ProductCard = ({ product }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useAuth();

  const quantityInCart = getItemQuantity(product._id);
  const inWishlist = isInWishlist(product._id);

  // BigBasket Indian grocery pricing fields with fallback
  const sellingPrice = Number(product.sellingPrice ?? product.discountedPrice ?? 0);
  const mrp = Number(product.mrp ?? product.originalPrice ?? sellingPrice);
  const discountPercentage = Number(
    product.discountPercentage ??
    product.discountPercent ??
    (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0)
  );
  const formattedWeight = product.weight ? `${product.weight} ${product.unit}` : product.unit;

  // Image resolution & packaged vs fresh produce layout rules
  const imageUrl = getProductImageUrl(product);
  const packaged = isPackagedProduct(product);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, quantityInCart + 1);
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, quantityInCart - 1);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="group relative bg-white border border-gray-200/80 hover:border-emerald-500 rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Top Bar: Discount Badge & Wishlist Heart */}
      <div className="flex items-center justify-between w-full mb-2 min-h-[22px]">
        {discountPercentage > 0 ? (
          <span className="badge-discount text-[11px] font-extrabold px-2 py-0.5">
            {discountPercentage}% OFF
          </span>
        ) : (
          <div></div>
        )}

        <button
          onClick={handleWishlistToggle}
          aria-label="Toggle Wishlist"
          className={`p-1.5 rounded-full transition-all ${
            inWishlist
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Image Clickable to Detail */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative overflow-hidden rounded-xl bg-gray-50/70 mb-3 aspect-square flex items-center justify-center p-2"
      >
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className={`w-full h-full ${
            packaged ? 'object-contain p-1' : 'object-cover'
          } object-center rounded-lg group-hover:scale-105 transition-transform duration-500`}
        />

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 flex flex-col">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-1">
          <span className="uppercase tracking-wider truncate max-w-[110px]">{product.brand}</span>
          {product.rating > 0 ? (
            <span className="flex items-center space-x-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span>{product.rating.toFixed(1)}</span>
              {(product.numReviews > 0 || product.numberOfReviews > 0) && (
                <span className="text-[10px] text-gray-400 font-normal">
                  ({product.numReviews || product.numberOfReviews})
                </span>
              )}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-medium">No ratings yet</span>
          )}
        </div>

        {/* Product Title */}
        <Link
          to={`/product/${product.slug}`}
          className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[2.5rem] leading-snug"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Pack Size / Weight Unit */}
        <div className="text-[11px] font-medium text-gray-500 mt-1 mb-2">
          {formattedWeight}
        </div>

        {/* Low Stock Warning */}
        {isLowStock && (
          <div className="text-[10px] font-bold text-amber-600 mb-1">
            ⚡ Only {product.stock} units left!
          </div>
        )}

        {/* Price & Action Section */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          {/* Price block: BigBasket India style (Prominent Selling Price, Strikethrough MRP) */}
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-emerald-950 leading-none">
              ₹{sellingPrice}
            </span>
            {mrp > sellingPrice && (
              <span className="text-[11px] text-gray-400 line-through font-medium mt-0.5">
                MRP: ₹{mrp}
              </span>
            )}
          </div>

          {/* BigBasket-Style Add to Cart or Quantity Stepper */}
          <div className="flex items-center justify-end">
            {isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed"
              >
                Unavailable
              </button>
            ) : quantityInCart === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-sm hover:shadow-md active:scale-95 tracking-wide"
                title="Add to Basket"
              >
                <span>ADD</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 bg-white border-2 border-emerald-600 text-emerald-900 rounded-xl px-2 py-0.5 shadow-sm transition-all duration-200">
                <button
                  onClick={handleDecrement}
                  className="p-1 hover:bg-emerald-100/60 rounded-lg text-emerald-700 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-emerald-950 w-5 text-center select-none">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantityInCart >= product.stock}
                  className="p-1 hover:bg-emerald-100/60 disabled:opacity-40 rounded-lg text-emerald-700 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
