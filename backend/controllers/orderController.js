import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';

// Helper to generate unique order number: FSH-YYYYMMDD-XXXX
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FSH-${date}-${random}`;
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      deliverySlot,
      deliveryType = 'standard',
      deliveryEstimatedTime,
      paymentMethod = 'cod',
      couponCode,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order',
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete delivery address details',
      });
    }

    // Verify stock and compute prices server-side
    let itemsPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name || item.product}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Only ${product.stock} units left.`,
        });
      }

      const price = product.sellingPrice ?? product.discountedPrice;
      const itemTotal = price * item.quantity;
      itemsPrice += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        quantity: item.quantity,
        price: price,
        unit: product.unit,
      });
    }

    // Apply coupon if provided - calculate securely server-side
    let discountAmount = 0;
    let isFreeShipping = false;
    let couponApplied = { code: null, discountType: 'flat', discountValue: 0, discountAmount: 0 };

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      });

      const expiry = coupon?.expiryDate || coupon?.validUntil;
      const minAmount = coupon?.minimumOrderAmount ?? coupon?.minOrderValue ?? 0;

      if (coupon && (!expiry || new Date(expiry) >= new Date()) && itemsPrice >= minAmount) {
        const type = coupon.discountType || (coupon.discountPercent ? 'percentage' : 'flat');

        if (type === 'flat') {
          discountAmount = coupon.discountValue ?? coupon.discountPercent ?? 0;
        } else if (type === 'percentage') {
          const rate = coupon.discountValue ?? coupon.discountPercent ?? 0;
          let disc = Math.round((itemsPrice * rate) / 100);
          const maxCap = coupon.maximumDiscount ?? coupon.maxDiscount;
          if (maxCap && disc > maxCap) {
            disc = maxCap;
          }
          discountAmount = disc;
        } else if (type === 'free_shipping' || coupon.code === 'FREESHIP') {
          isFreeShipping = true;
        }

        couponApplied = {
          code: coupon.code,
          discountType: type,
          discountValue: coupon.discountValue ?? coupon.discountPercent,
          discountAmount,
        };
      }
    }

    // Calculate delivery fee based on deliveryType and zone settings
    let deliveryFee = 25;
    let estTime = deliveryEstimatedTime || (deliveryType === 'express' ? '10–15 mins' : '30–45 mins');
    let estMinutes = deliveryType === 'express' ? 10 : 35;

    if (deliveryType === 'express') {
      deliveryFee = itemsPrice >= 699 || isFreeShipping ? 0 : 39;
    } else {
      deliveryFee = itemsPrice >= 499 || isFreeShipping ? 0 : 25;
    }

    const totalAmount = Math.max(0, itemsPrice - discountAmount + deliveryFee);

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      deliverySlot: {
        date: deliverySlot?.date || (deliveryType === 'express' ? 'Today' : 'Tomorrow'),
        timeWindow: deliverySlot?.timeWindow || (deliveryType === 'express' ? '10-Minute Express Delivery' : '7:00 AM - 9:00 AM'),
      },
      deliveryType,
      estimatedDeliveryMinutes: estMinutes,
      estimatedDeliveryTime: estTime,
      paymentMethod,
      paymentStatus: 'pending',
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      discountAmount,
      deliveryFee,
      totalAmount: Math.round(totalAmount * 100) / 100,
      couponApplied,
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(),
          comment: `Order placed via ${paymentMethod.toUpperCase()} (${deliveryType === 'express' ? '10-Min Express' : 'Standard Delivery'})`,
        },
      ],
    });

    // Deduct stock for each product
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's cart in database
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ensure only the owner or an admin can view
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    if (order.orderStatus !== 'Pending' && order.orderStatus !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in '${order.orderStatus}' status`,
      });
    }

    order.orderStatus = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      comment: 'Cancelled by customer',
    });

    // Restock products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully and items returned to stock',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'All') query.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, comment, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (status) {
      order.orderStatus = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        comment: comment || `Status updated to ${status} by admin`,
      });

      // If marked Delivered and COD, mark payment as paid
      if (status === 'Delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

