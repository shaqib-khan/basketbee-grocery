import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  Truck,
  Check,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { orderAPI } from '../services/api';

const ORDER_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await orderAPI.getOrderById(id);
        if (res.success) {
          setOrder(res.data);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading order summary...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Order Not Found</h2>
        <Link to="/orders" className="text-emerald-700 font-bold hover:underline">
          Return to Order History
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Back button & Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Link
            to="/orders"
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="Back to Orders"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isCancelled
              ? 'bg-red-100 text-red-800'
              : order.orderStatus === 'Delivered'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {order.orderStatus}
        </span>
      </div>

      {/* Visual Tracking Progress Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Delivery Status Tracker
        </h3>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-red-50 text-red-800 border border-red-200 flex items-center space-x-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="text-xs font-semibold">
              This order was cancelled. All reserved items have been restored to inventory.
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-between pt-4 pb-2">
            {/* Background line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
            {/* Filled line */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentStepIndex) / (ORDER_STEPS.length - 1)) * 100}%`,
              }}
            ></div>

            {ORDER_STEPS.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-4 ring-white'
                        : 'bg-gray-200 text-gray-500 ring-4 ring-white'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-2 ${
                      isCurrent ? 'text-emerald-800 font-black' : isPassed ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Delivery Info & Payment Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Shipping Destination */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Delivery Destination</span>
          </div>
          <div className="font-bold text-sm text-gray-900">{order.shippingAddress?.fullName}</div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          <div className="text-xs text-gray-700 font-semibold pt-1">
            📞 Phone: {order.shippingAddress?.phone}
          </div>
        </div>

        {/* Delivery Slot & Payment */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Scheduled Delivery Slot</span>
          </div>
          <div className="font-bold text-sm text-gray-900">
            {order.deliverySlot?.date} &bull; {order.deliverySlot?.timeWindow}
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Payment:</span>
            <span className="font-bold uppercase text-gray-900">{order.paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Payment Status:</span>
            <span
              className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Order Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
          Package Contents ({order.items?.length})
        </h3>

        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item._id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50">
              <div className="flex items-center space-x-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-xl border border-gray-100"
                />
                <div>
                  <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                  <div className="text-gray-400">{item.unit} &bull; ₹{item.price} x {item.quantity}</div>
                </div>
              </div>
              <div className="font-black text-gray-900 text-sm">
                ₹{item.price * item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* Bill Calculations */}
        <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600 max-w-sm ml-auto">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-bold text-gray-900">₹{order.itemsPrice}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Coupon Savings</span>
              <span>- ₹{order.discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-bold text-gray-900">
              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
            </span>
          </div>
          <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
            <span>Final Paid</span>
            <span className="text-emerald-950 text-base">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

