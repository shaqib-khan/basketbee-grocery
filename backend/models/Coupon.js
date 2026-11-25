import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'flat', 'free_shipping'],
      default: 'flat',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrderAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maximumDiscount: {
      type: Number,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: 'Exclusive grocery discount offer',
    },
    // Backward-compatibility aliases
    discountPercent: {
      type: Number,
    },
    maxDiscount: {
      type: Number,
    },
    minOrderValue: {
      type: Number,
    },
    validUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to keep aliases synchronized
couponSchema.pre('save', function (next) {
  if (this.minimumOrderAmount && !this.minOrderValue) {
    this.minOrderValue = this.minimumOrderAmount;
  } else if (this.minOrderValue && !this.minimumOrderAmount) {
    this.minimumOrderAmount = this.minOrderValue;
  }

  if (this.maximumDiscount && !this.maxDiscount) {
    this.maxDiscount = this.maximumDiscount;
  } else if (this.maxDiscount && !this.maximumDiscount) {
    this.maximumDiscount = this.maxDiscount;
  }

  if (this.expiryDate && !this.validUntil) {
    this.validUntil = this.expiryDate;
  } else if (this.validUntil && !this.expiryDate) {
    this.expiryDate = this.validUntil;
  }

  if (this.discountType === 'percentage' && !this.discountPercent) {
    this.discountPercent = this.discountValue;
  }
  next();
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
