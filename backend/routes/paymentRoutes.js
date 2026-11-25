import express from 'express';
import {
  createCheckoutSession,
  verifyPayment,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/create-checkout-session', createCheckoutSession);
router.post('/verify', verifyPayment);

export default router;

