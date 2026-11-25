import express from 'express';
import {
  validateCoupon,
  getActiveCoupons,
  createCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getActiveCoupons);
router.post('/validate', validateCoupon);

// Admin coupon management
router.post('/', protect, adminOnly, createCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

export default router;

