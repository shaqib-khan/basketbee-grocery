import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Power,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { adminAPI, deliveryAPI } from '../../services/api';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'delivery-zones'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delivery zones state
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    pincode: '',
    locality: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    minimumOrderAmount: 199,
    deliveryFee: 29,
    freeDeliveryAbove: 499,
    estimatedDeliveryTime: '30-45 mins',
    isActive: true,
  });
  const [zoneMsg, setZoneMsg] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fetchZones = async () => {
    try {
      setZonesLoading(true);
      const res = await deliveryAPI.getAllZones();
      if (res.success && Array.isArray(res.data)) {
        setZones(res.data);
      }
    } catch (err) {
      console.error('Error fetching delivery zones:', err);
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'delivery-zones') {
      fetchZones();
    }
  }, [activeTab]);

  const handleToggleZoneStatus = async (zone) => {
    try {
      const res = await deliveryAPI.updateZone(zone._id, { isActive: !zone.isActive });
      if (res.success) {
        setZones((prev) =>
          prev.map((z) => (z._id === zone._id ? { ...z, isActive: !z.isActive } : z))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle zone status');
    }
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery PIN code zone?')) return;
    try {
      const res = await deliveryAPI.deleteZone(id);
      if (res.success) {
        setZones((prev) => prev.filter((z) => z._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete zone');
    }
  };

  const handleStartEditZone = (zone) => {
    setEditingZoneId(zone._id);
    setZoneForm({
      pincode: zone.pincode,
      locality: zone.locality,
      city: zone.city,
      state: zone.state,
      minimumOrderAmount: zone.minimumOrderAmount,
      deliveryFee: zone.deliveryFee,
      freeDeliveryAbove: zone.freeDeliveryAbove,
      estimatedDeliveryTime: zone.estimatedDeliveryTime,
      isActive: zone.isActive !== false,
    });
    setShowZoneForm(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    setZoneMsg('');

    if (!/^\d{6}$/.test(zoneForm.pincode)) {
      setZoneMsg('Please enter a valid 6-digit PIN code.');
      return;
    }

    try {
      if (editingZoneId) {
        const res = await deliveryAPI.updateZone(editingZoneId, zoneForm);
        if (res.success) {
          setEditingZoneId(null);
          setShowZoneForm(false);
          fetchZones();
        }
      } else {
        const res = await deliveryAPI.createZone(zoneForm);
        if (res.success) {
          setShowZoneForm(false);
          fetchZones();
        }
      }
    } catch (err) {
      setZoneMsg(err.message || 'Failed to save delivery zone');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading admin analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <LayoutDashboard className="w-4 h-4" />
            <span>BasketBee Administration Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Store Performance &amp; Operations
          </h1>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/products"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Fulfill Orders</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Store Analytics
        </button>
        <button
          onClick={() => setActiveTab('delivery-zones')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
            activeTab === 'delivery-zones'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>📍 Delivery PIN Codes &amp; Serviceability</span>
        </button>
      </div>

      {/* VIEW 1: Analytics */}
      {activeTab === 'analytics' && (
        <>
          {/* 1. Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</span>
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{stats?.totalSales?.toLocaleString('en-IN') || 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified Paid Orders</span>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-800">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {stats?.totalOrders || 0}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Pending, Processing &amp; Delivered
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Users</span>
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {stats?.totalCustomers || 0}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Active Consumer Accounts
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Catalog SKUs</span>
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {stats?.totalProducts || 0}
              </div>
              <div className="text-[11px] text-amber-700 font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats?.lowStockCount || 0} items low on stock</span>
              </div>
            </div>
          </div>

          {/* 2. Low Stock Alerts & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-black text-base text-gray-900">Recent Customer Orders</h3>
                <Link
                  to="/admin/orders"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                >
                  <span>View All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats?.recentOrders?.map((ord) => (
                      <tr key={ord._id} className="hover:bg-gray-50/60">
                        <td className="py-3 font-mono font-bold text-gray-900">
                          #{ord.orderNumber || ord._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 text-gray-600">{ord.user?.name || ord.shippingAddress?.fullName}</td>
                        <td className="py-3 font-black text-emerald-800">₹{ord.totalAmount}</td>
                        <td className="py-3">
                          <span className="font-bold text-gray-700">{ord.orderStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-amber-800 pb-3 border-b border-gray-100 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Stock Inventory Alerts</span>
              </div>

              <div className="space-y-3">
                {stats?.lowStockProducts?.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    All products have healthy inventory levels!
                  </div>
                ) : (
                  stats?.lowStockProducts?.map((p) => (
                    <div
                      key={p._id}
                      className="p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-9 h-9 object-cover rounded-lg border border-amber-200 shrink-0"
                        />
                        <div className="truncate text-xs">
                          <div className="font-bold text-gray-900 truncate max-w-[120px]">{p.name}</div>
                          <div className="text-[10px] text-gray-500">{p.unit}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {p.stock} units
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Delivery PIN Codes Management */}
      {activeTab === 'delivery-zones' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-black text-lg text-gray-900">
                Supported Delivery PIN Codes
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure delivery serviceability, estimated delivery turnaround, minimum order value, and fees.
              </p>
            </div>

            {!showZoneForm && (
              <button
                onClick={() => {
                  setEditingZoneId(null);
                  setZoneForm({
                    pincode: '',
                    locality: '',
                    city: 'Lucknow',
                    state: 'Uttar Pradesh',
                    minimumOrderAmount: 199,
                    deliveryFee: 29,
                    freeDeliveryAbove: 499,
                    estimatedDeliveryTime: '30-45 mins',
                    isActive: true,
                  });
                  setShowZoneForm(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Delivery Zone</span>
              </button>
            )}
          </div>

          {/* Form */}
          {showZoneForm && (
            <form onSubmit={handleSaveZone} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                {editingZoneId ? 'Edit Delivery Zone' : 'Add New Serviceable PIN Code'}
              </h3>

              {zoneMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{zoneMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 226016"
                    value={zoneForm.pincode}
                    onChange={(e) => setZoneForm({ ...zoneForm, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Locality / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indira Nagar"
                    value={zoneForm.locality}
                    onChange={(e) => setZoneForm({ ...zoneForm, locality: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Est. Delivery Time</label>
                  <input
                    type="text"
                    placeholder="30-45 mins"
                    value={zoneForm.estimatedDeliveryTime}
                    onChange={(e) => setZoneForm({ ...zoneForm, estimatedDeliveryTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={zoneForm.deliveryFee}
                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Free Delivery Above (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={zoneForm.freeDeliveryAbove}
                    onChange={(e) => setZoneForm({ ...zoneForm, freeDeliveryAbove: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Min. Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={zoneForm.minimumOrderAmount}
                    onChange={(e) => setZoneForm({ ...zoneForm, minimumOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="zoneActive"
                  checked={zoneForm.isActive}
                  onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="zoneActive" className="text-xs text-gray-700 cursor-pointer font-medium">
                  Service Active (Customers at this PIN can order)
                </label>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowZoneForm(false);
                    setEditingZoneId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingZoneId ? 'Update Zone' : 'Create Delivery Zone'}
                </button>
              </div>
            </form>
          )}

          {/* Zones Table */}
          {zonesLoading ? (
            <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading delivery zones...</span>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No delivery zones configured. Click "Add Delivery Zone" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">PIN Code</th>
                    <th className="pb-3">Locality / City</th>
                    <th className="pb-3">Estimated Time</th>
                    <th className="pb-3">Delivery Fee</th>
                    <th className="pb-3">Free Above</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zones.map((z) => (
                    <tr key={z._id} className="hover:bg-gray-50/60">
                      <td className="py-3 font-mono font-bold text-gray-900">{z.pincode}</td>
                      <td className="py-3 text-gray-700">
                        <span className="font-semibold">{z.locality}</span>, {z.city}
                      </td>
                      <td className="py-3 font-medium text-emerald-800">⚡ {z.estimatedDeliveryTime}</td>
                      <td className="py-3 font-semibold">₹{z.deliveryFee}</td>
                      <td className="py-3 text-gray-500">₹{z.freeDeliveryAbove}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleZoneStatus(z)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition-colors ${
                            z.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          <Power className="w-2.5 h-2.5" />
                          <span>{z.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleStartEditZone(z)}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded"
                          title="Edit Zone"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(z._id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
