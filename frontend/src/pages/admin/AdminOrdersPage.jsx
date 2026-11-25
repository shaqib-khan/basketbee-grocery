import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Phone,
  Search,
  Filter,
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAllOrders({
        status: statusFilter === 'All' ? undefined : statusFilter,
        limit: 50,
      });
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
  }, [statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await orderAPI.updateOrderStatus(orderId, {
        status: newStatus,
        comment: `Order status transitioned to ${newStatus} by store administrator`,
      });
      if (res.success) {
        toast.success(`Order updated to '${newStatus}'`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Order Fulfillment &amp; Dispatch
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track, update shipping stages, and monitor delivery completions
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-gray-100 p-1 rounded-2xl">
          {['All', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          No orders found matching the filter &lsquo;{statusFilter}&rsquo;.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      &bull; {new Date(order.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Customer: <strong className="text-gray-900">{order.user?.name || order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone})
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-950">
                      ₹{order.totalAmount}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                      {order.paymentMethod} &bull;{' '}
                      <span className={order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-600 shadow-sm"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items & Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Items preview */}
                <div className="space-y-1.5">
                  <div className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    Items ({order.items.length})
                  </div>
                  <div className="space-y-1">
                    {order.items.map((i) => (
                      <div key={i._id} className="flex justify-between text-gray-700">
                        <span>
                          {i.name} ({i.unit}) x{i.quantity}
                        </span>
                        <span className="font-semibold">₹{i.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery details */}
                <div className="space-y-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="font-bold text-gray-400 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>Delivery Address &amp; Slot</span>
                  </div>
                  <div className="text-gray-800 font-semibold">{order.shippingAddress?.street}, {order.shippingAddress?.city} ({order.shippingAddress?.pincode})</div>
                  <div className="text-gray-500 flex items-center space-x-1 pt-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>Slot: {order.deliverySlot?.date} ({order.deliverySlot?.timeWindow})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;

