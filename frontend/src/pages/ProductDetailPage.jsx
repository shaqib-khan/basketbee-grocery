import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  Star,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Share2,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/common/ProductCard';
import { getProductImageUrl, isPackagedProduct, FALLBACK_IMAGE } from '../utils/productImages';

const ProductDetailPage = () => {
  const { idOrSlug } = useParams();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist, isAuthenticated, openAuthModal } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productAPI.getByIdOrSlug(idOrSlug);
        if (res.success && res.data) {
          setProduct(res.data);
          setSelectedImage(res.data.image);
          setRelatedProducts(res.related || []);
          setReviews(res.data.reviews || []);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading BasketBee product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Product Not Found</h2>
        <p className="text-xs text-gray-500">The product you are looking for is unavailable or moved.</p>
        <Link
          to="/products"
          className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Browse All Supermarket Products
        </Link>
      </div>
    );
  }

  const quantityInCart = getItemQuantity(product._id);
  const inWishlist = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  // Indian pricing attributes
  const sellingPrice = Number(product.sellingPrice ?? product.discountedPrice ?? 0);
  const mrp = Number(product.mrp ?? product.originalPrice ?? sellingPrice);
  const discountPercentage = Number(
    product.discountPercentage ??
    product.discountPercent ??
    (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0)
  );
  const formattedWeight = product.weight ? `${product.weight} ${product.unit}` : product.unit;
  const reviewsCount = reviews.length || product.numberOfReviews || product.numReviews || 0;
  const avgRating = Number(product.rating || 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('otp');
      toast.info('Please sign in to submit your product review');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please write a short review comment');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await productAPI.addReview(product._id, {
        rating: newRating,
        title: newTitle.trim(),
        comment: newComment.trim(),
      });

      if (res.success) {
        toast.success(res.message || 'Review submitted successfully!');
        if (res.data?.review) {
          setReviews((prev) => [res.data.review, ...prev]);
        }
        if (res.data?.product) {
          setProduct((prev) => ({
            ...prev,
            rating: res.data.product.rating,
            numberOfReviews: res.data.product.numberOfReviews,
          }));
        }
        setNewTitle('');
        setNewComment('');
        setShowReviewForm(false);
      }
    } catch (err) {
      toast.error(err.message || 'Could not submit review. Verified purchasers only.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="hover:text-emerald-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-emerald-700">Supermarket</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${product.categorySlug || product.category}`} className="hover:text-emerald-700">
          {product.categoryName || product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* 2. Main Product Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs">
        {/* Gallery / Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl bg-gray-50/60 border border-gray-100 flex items-center justify-center p-4 overflow-hidden">
            {discountPercentage > 0 && (
              <span className="absolute top-4 left-4 z-10 badge-discount text-xs font-black px-2.5 py-1">
                {discountPercentage}% OFF
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product._id)}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-md transition-all ${
                inWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>

            <img
              src={selectedImage || getProductImageUrl(product)}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
              className={`w-full h-full ${
                isPackagedProduct(product) ? 'object-contain' : 'object-cover'
              } rounded-xl`}
            />

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="bg-red-600 text-white font-black text-sm px-4 py-2 rounded-xl uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                    selectedImage === img ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Brand & Share */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {product.brand}
              </span>
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Share Product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings & Reviews Count */}
            <div className="flex items-center space-x-3 text-xs">
              {avgRating > 0 ? (
                <div className="flex items-center space-x-1.5 bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                  <span>{avgRating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-lg">
                  No ratings yet
                </span>
              )}
              <span className="text-gray-400">&bull;</span>
              <span className="text-gray-600 font-semibold">
                {reviewsCount} {reviewsCount === 1 ? 'Rating & Review' : 'Ratings & Reviews'}
              </span>
            </div>

            {/* Pack Size / Unit */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Pack Size: <span className="text-gray-900 font-black">{formattedWeight}</span>
            </div>

            {/* Price block */}
            <div className="pt-2 flex items-baseline space-x-3">
              <span className="text-3xl font-black text-emerald-950">₹{sellingPrice}</span>
              {mrp > sellingPrice && (
                <>
                  <span className="text-sm font-semibold text-gray-400 line-through">MRP: ₹{mrp}</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Save ₹{mrp - sellingPrice} ({discountPercentage}% OFF)
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              Inclusive of all applicable Indian taxes
            </div>

            {/* Stock Warning */}
            {isLowStock && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                ⚡ Hurry, only {product.stock} units remaining in stock!
              </div>
            )}
          </div>

          {/* Action Buttons: Add / Stepper */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-200 text-gray-500 rounded-2xl font-bold text-sm cursor-not-allowed"
              >
                Currently Out of Stock
              </button>
            ) : quantityInCart === 0 ? (
              <button
                onClick={() => addToCart(product, 1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>ADD TO BASKET</span>
              </button>
            ) : (
              <div className="flex items-center space-x-4 bg-emerald-600 text-white rounded-2xl px-4 py-2 shadow-lg shadow-emerald-200 w-max">
                <button
                  onClick={() => updateQuantity(product._id, quantityInCart - 1)}
                  className="p-1.5 hover:bg-emerald-700 rounded-xl transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-black px-2">{quantityInCart}</span>
                <button
                  onClick={() => updateQuantity(product._id, quantityInCart + 1)}
                  disabled={quantityInCart >= product.stock}
                  className="p-1.5 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            <Link
              to="/cart"
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-sm transition-colors text-center"
            >
              View Basket
            </Link>
          </div>

          {/* Delivery & Assurance Badges */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-600 font-medium">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>10-min Express delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>100% Quality guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No-questions return</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Farm directly sourced</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Description & Nutritional Highlights */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
        <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
          About this Product
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
          {product.description}
        </p>

        {/* Nutritional info table */}
        {product.nutritionalInfo && product.nutritionalInfo.calories !== 'N/A' && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Nutritional Facts (Per 100g approx.)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <div className="text-gray-400 font-medium">Energy</div>
                <div className="font-black text-gray-900 mt-0.5">{product.nutritionalInfo.calories}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <div className="text-gray-400 font-medium">Protein</div>
                <div className="font-black text-gray-900 mt-0.5">{product.nutritionalInfo.protein}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <div className="text-gray-400 font-medium">Carbohydrates</div>
                <div className="font-black text-gray-900 mt-0.5">{product.nutritionalInfo.carbs}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <div className="text-gray-400 font-medium">Fats</div>
                <div className="font-black text-gray-900 mt-0.5">{product.nutritionalInfo.fat}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <div className="text-gray-400 font-medium">Dietary Fiber</div>
                <div className="font-black text-gray-900 mt-0.5">{product.nutritionalInfo.fiber || '0.5g'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Customer Ratings & Reviews Section */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200/80 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Customer Ratings &amp; Reviews
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified customer feedback from delivered orders
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('otp');
              } else {
                setShowReviewForm(!showReviewForm);
              }
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm self-start sm:self-auto flex items-center space-x-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
          </button>
        </div>

        {/* Rating Overview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gray-50/80 border border-gray-100">
          <div className="text-center sm:border-r border-gray-200 sm:pr-8">
            <div className="text-4xl sm:text-5xl font-black text-emerald-950">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div className="flex items-center justify-center space-x-1 my-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(avgRating) ? 'fill-current text-amber-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs font-medium text-gray-500">
              Based on {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          <div className="flex-1 text-xs text-gray-600 space-y-1.5 w-full">
            <div className="flex items-center space-x-2">
              <span className="w-12 font-semibold">5 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${reviews.length ? (reviews.filter((r) => r.rating === 5).length / reviews.length) * 100 : 80}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-12 font-semibold">4 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${reviews.length ? (reviews.filter((r) => r.rating === 4).length / reviews.length) * 100 : 15}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-12 font-semibold">3 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full"
                  style={{
                    width: `${reviews.length ? (reviews.filter((r) => r.rating === 3).length / reviews.length) * 100 : 5}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form (Only for verified purchasers) */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4 animate-fade-in">
            <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
              Share Your Experience With This Product
            </h4>

            {/* Star selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Your Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-700 ml-2">{newRating} of 5 Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Review Headline (Optional)
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Extremely fresh and crisp apples!"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Detailed Review
              </label>
              <textarea
                rows={3}
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tell other shoppers about freshness, packaging, and taste..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center space-x-2"
            >
              {submittingReview ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Submit Review</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">
              No customer reviews yet. Be the first verified customer to write a review!
            </p>
          ) : (
            reviews.map((rev, idx) => (
              <div key={rev._id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-xs">{rev.userName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-current text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  {rev.title && <span className="font-bold text-gray-800 text-xs ml-2">{rev.title}</span>}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Related Category Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            More from {product.categoryName || 'this Category'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel._id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
