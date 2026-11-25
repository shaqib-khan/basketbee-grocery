import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Shipped':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Processing':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getMyOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await orderAPI.cancelOrder(orderId);
      if (res.success) {
        toast.success('Order cancelled successfully');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Cannot cancel order');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading your past orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My Order History
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Track active grocery packages, review past deliveries, and download receipts
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No Orders Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You have not placed any orders with BasketBee yet. Start your healthy journey with our farm-fresh produce!
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-4 transition-all hover:border-emerald-300"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-950">
                      ₹{order.totalAmount}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">
                      {order.paymentMethod === 'stripe' ? 'Stripe Online' : 'Cash on Delivery'}
                    </div>
                  </div>

                  <Link
                    to={`/order/${order._id}`}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-800 hover:text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="flex items-center space-x-3 overflow-x-auto py-1">
                {order.items.slice(0, 4).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center space-x-2 p-2 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded-lg"
                    />
                    <div className="text-xs truncate max-w-[120px]">
                      <div className="font-semibold text-gray-800 truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400">Qty: {item.quantity}</div>
                    </div>
                  </div>
                ))}
                {order.items.length > 4 && (
                  <span className="text-xs font-bold text-gray-400 whitespace-nowrap pl-2">
                    +{order.items.length - 4} more
                  </span>
                )}
              </div>

              {/* Delivery Schedule info & Cancel option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50 gap-2">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Scheduled: <strong>{order.deliverySlot?.date}</strong> ({order.deliverySlot?.timeWindow})
                  </span>
                </div>

                {order.orderStatus === 'Pending' && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="text-red-600 hover:text-red-700 font-bold self-start sm:self-auto"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;

