import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

// @desc    Get Admin Dashboard Stats & Metrics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      orderStatusCounts,
      salesData,
      categoriesCount,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Product.find({ stock: { $lte: 15 } }).select('name stock image discountedPrice unit categoryName').limit(10),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6),
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
          },
        },
      ]),
      Category.countDocuments(),
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

    // Monthly orders & revenue trend for chart (last 6 months)
    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        totalCustomers,
        totalProducts,
        totalCategories: categoriesCount,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders,
        orderStatusCounts: orderStatusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

