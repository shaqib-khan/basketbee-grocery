import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: [true, 'PIN code is required'],
      unique: true,
      trim: true,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit Indian PIN code'],
    },
    locality: {
      type: String,
      required: [true, 'Locality or area name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Lucknow',
      trim: true,
    },
    state: {
      type: String,
      required: true,
      default: 'Uttar Pradesh',
      trim: true,
    },
    deliveryAvailable: {
      type: Boolean,
      default: true,
    },
    minimumOrderAmount: {
      type: Number,
      required: true,
      default: 199,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 25,
      min: 0,
    },
    freeDeliveryAbove: {
      type: Number,
      required: true,
      default: 499,
      min: 0,
    },
    estimatedDeliveryTime: {
      type: String,
      required: true,
      default: '30–45 mins',
      trim: true,
    },
    // Quick-commerce: 10-Minute Express Delivery
    expressAvailable: {
      type: Boolean,
      default: true,
    },
    expressDeliveryTime: {
      type: String,
      default: '10–15 mins',
      trim: true,
    },
    expressDeliveryFee: {
      type: Number,
      default: 39,
      min: 0,
    },
    expressFreeAbove: {
      type: Number,
      default: 699,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);
export default DeliveryZone;
