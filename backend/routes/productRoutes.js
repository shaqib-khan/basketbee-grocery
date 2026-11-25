import express from 'express';
import {
  getProducts,
  getSearchSuggestions,
  getFeaturedProducts,
  getProductByIdOrSlug,
  searchProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteProductReview,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/search', searchProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:idOrSlug', getProductByIdOrSlug);

// Product reviews & ratings
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', protect, createProductReview);
router.delete('/:id/reviews/:reviewId', protect, adminOnly, deleteProductReview);

// Admin product management
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;

