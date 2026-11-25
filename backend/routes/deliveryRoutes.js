import express from 'express';
import {
  checkDeliveryServiceability,
  checkServiceabilityPost,
  getDeliveryOptions,
  getServiceableZones,
  getAllZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
} from '../controllers/deliveryController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/check/:pincode', checkDeliveryServiceability);
router.post('/check-serviceability', checkServiceabilityPost);
router.get('/options', getDeliveryOptions);
router.get('/serviceable', getServiceableZones);

// Admin Routes
router.get('/zones', protect, adminOnly, getAllZones);
router.post('/zones', protect, adminOnly, createDeliveryZone);
router.put('/zones/:id', protect, adminOnly, updateDeliveryZone);
router.delete('/zones/:id', protect, adminOnly, deleteDeliveryZone);

export default router;

