import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { orderAPI, paymentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(!!sessionId);

  useEffect(() => {
    const fetchAndVerify = async () => {
      try {
        setLoading(true);

        // If Stripe redirected back with session_id, verify server-side
        if (sessionId) {
          try {
            await paymentAPI.verifyPayment(orderId, sessionId);
            toast.success('Payment confirmed successfully by server');
          } catch (payErr) {
            console.warn('Payment verification notice:', payErr.message);
          } finally {
            setVerifyingPayment(false);
          }
        }

        const res = await orderAPI.getOrderById(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndVerify();
  }, [orderId, sessionId, toast]);

  if (loading || verifyingPayment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">
          Confirming Your Order &amp; Payment...
        </h2>
        <p className="text-xs text-gray-500">
          Please wait while we verify your transaction with the server.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Order Not Found</h2>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      {/* 1. Success Hero Banner */}
      <div className="bg-emerald-600 text-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-emerald-200/50 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Thank You! Your Order is Confirmed
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
          We have received your grocery order and our warehouse associates are preparing your fresh basket.
        </p>
        <div className="inline-block bg-emerald-800/60 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider mt-2">
          ORDER ID: {order.orderNumber}
        </div>
      </div>

      {/* 2. Order Key Details Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-gray-100 text-xs">
          {/* Delivery Slot */}
          <div className="space-y-1">
            <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivery Slot</span>
            </span>
            <div className="font-bold text-gray-900">{order.deliverySlot?.date}</div>
            <div className="text-gray-500">{order.deliverySlot?.timeWindow}</div>
          </div>

          {/* Payment Status */}
          <div className="space-y-1">
            <span className="font-bold text-gray-400 uppercase tracking-wider">
              Payment Method
            </span>
            <div className="font-bold text-gray-900 uppercase">
              {order.paymentMethod === 'stripe' ? 'Stripe Card Payment' : 'Cash on Delivery (COD)'}
            </div>
            <div>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus === 'paid' ? 'Paid Online' : 'Pay Upon Delivery'}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <span className="font-bold text-gray-400 uppercase tracking-wider">
              Order Status
            </span>
            <div className="font-bold text-emerald-800 flex items-center space-x-1">
              <Package className="w-4 h-4" />
              <span>{order.orderStatus}</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivery Destination</span>
          </h3>
          <p className="text-xs text-gray-800 font-semibold">{order.shippingAddress?.fullName} ({order.shippingAddress?.phone})</p>
          <p className="text-xs text-gray-600">
            {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
          </p>
        </div>

        {/* Items Summary Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Items in this Order ({order.items?.length})
          </h3>
          <div className="space-y-2.5">
            {order.items?.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-gray-400">{item.unit} &bull; Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="font-black text-gray-900">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price breakdown */}
        <div className="pt-4 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span>₹{order.itemsPrice}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Coupon Savings</span>
              <span>- ₹{order.discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
            <span>Total Payable Amount</span>
            <span className="text-emerald-800 text-base">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/orders"
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all text-center flex items-center justify-center space-x-2"
        >
          <Package className="w-4 h-4" />
          <span>View All My Orders</span>
        </Link>
        <Link
          to="/products"
          className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs transition-colors text-center flex items-center justify-center space-x-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

