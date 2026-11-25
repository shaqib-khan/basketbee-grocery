import Coupon from '../models/Coupon.js';

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a coupon code',
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code. Please check the code and try again.',
      });
    }

    const expiry = coupon.expiryDate || coupon.validUntil;
    if (expiry && new Date(expiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `Promo code '${coupon.code}' has expired on ${new Date(expiry).toLocaleDateString()}.`,
      });
    }

    const minAmount = coupon.minimumOrderAmount ?? coupon.minOrderValue ?? 0;
    const currentAmount = Number(orderAmount) || 0;

    if (currentAmount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Add items worth ₹${minAmount - currentAmount} more to unlock offer '${coupon.code}' (Min order: ₹${minAmount}).`,
      });
    }

    // Calculate exact discount based on discountType
    let discount = 0;
    const type = coupon.discountType || (coupon.discountPercent ? 'percentage' : 'flat');

    if (type === 'flat') {
      discount = coupon.discountValue ?? coupon.discountPercent ?? 0;
    } else if (type === 'percentage') {
      const rate = coupon.discountValue ?? coupon.discountPercent ?? 0;
      discount = Math.round((currentAmount * rate) / 100);
      const maxCap = coupon.maximumDiscount ?? coupon.maxDiscount;
      if (maxCap && discount > maxCap) {
        discount = maxCap;
      }
    } else if (type === 'free_shipping') {
      discount = 25; // Delivery fee waived
    }

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully! You saved ₹${discount}`,
      data: {
        _id: coupon._id,
        code: coupon.code,
        discountType: type,
        discountValue: coupon.discountValue ?? coupon.discountPercent,
        discountAmount: discount,
        minimumOrderAmount: minAmount,
        maximumDiscount: coupon.maximumDiscount ?? coupon.maxDiscount,
        expiryDate: expiry,
        description: coupon.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active coupons list
// @route   GET /api/coupons
// @access  Public
export const getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiryDate: { $gte: new Date() } },
        { validUntil: { $gte: new Date() } },
        { expiryDate: null },
      ],
    }).sort({ minimumOrderAmount: 1 });

    res.json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType = 'flat',
      discountValue,
      discountPercent,
      minimumOrderAmount,
      minOrderValue,
      maximumDiscount,
      maxDiscount,
      expiryDate,
      validUntil,
      description,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A coupon with this code already exists',
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue ?? discountPercent ?? 0),
      minimumOrderAmount: Number(minimumOrderAmount ?? minOrderValue ?? 0),
      maximumDiscount: maximumDiscount || maxDiscount ? Number(maximumDiscount || maxDiscount) : null,
      expiryDate: expiryDate || validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      description: description || 'Special Freshly promotional voucher',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
