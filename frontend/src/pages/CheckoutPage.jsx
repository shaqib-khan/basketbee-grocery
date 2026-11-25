import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Plus,
  ArrowRight,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation as useDeliveryLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { orderAPI, paymentAPI } from '../services/api';

const DELIVERY_SLOTS = [
  {
    id: 'express_now',
    date: 'Today',
    timeWindow: 'Express 10–15 mins',
    badge: 'FASTEST',
  },
  {
    id: 'morning_early',
    date: 'Tomorrow',
    timeWindow: '7:00 AM - 9:00 AM',
    badge: 'RECOMMENDED',
  },
  {
    id: 'morning_mid',
    date: 'Tomorrow',
    timeWindow: '9:00 AM - 1:00 PM',
    badge: null,
  },
  {
    id: 'evening',
    date: 'Tomorrow',
    timeWindow: '4:00 PM - 8:00 PM',
    badge: null,
  },
];

const CheckoutPage = () => {
  const { user, addAddress } = useAuth();
  const {
    items,
    itemCount,
    totalMRP,
    subtotal,
    productSavings,
    coupon,
    couponDiscount,
    couponSavings,
    clearCart,
  } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  // Delivery speed selection: 'express' | 'standard'
  const [deliveryType, setDeliveryType] = useState('express');

  // Selected address state
  const addresses = user?.addresses || [];
  const defaultAddressId = addresses.find((a) => a.isDefault)?._id || addresses[0]?._id || null;
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddressId);

  // Delivery Serviceability check
  const { checkServiceability } = useDeliveryLocation();
  const [serviceability, setServiceability] = useState({
    checking: false,
    serviceable: true,
    message: '',
    zone: null,
  });

  // New address toggle & form state
  const [showNewAddressForm, setShowNewAddressForm] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226016',
    landmark: '',
    addressType: 'Home',
    isDefault: false,
  });

  // Delivery slot state
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);

  // Payment method state ('stripe' or 'cod')
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0]._id);
    }
  }, [addresses, selectedAddressId]);

  // Dynamic delivery fee calculation based on speed choice
  const calculatedDeliveryFee =
    deliveryType === 'express'
      ? subtotal >= 699
        ? 0
        : 39
      : subtotal >= 499
      ? 0
      : 25;

  const currentTotalAmount = Math.max(0, subtotal - (couponSavings || couponDiscount || 0) + calculatedDeliveryFee);
  const calculatedTotalSavings = productSavings + (couponSavings || couponDiscount || 0);

  // Verify PIN serviceability whenever active address changes
  useEffect(() => {
    const activePin = showNewAddressForm
      ? newAddress.pincode
      : addresses.find((a) => a._id === selectedAddressId)?.pincode;

    if (activePin && activePin.length === 6) {
      setServiceability((prev) => ({ ...prev, checking: true }));
      checkServiceability(activePin).then((res) => {
        setServiceability({
          checking: false,
          serviceable: res.serviceable,
          message: res.message,
          zone: res.zone,
        });
      });
    }
  }, [showNewAddressForm, selectedAddressId, newAddress.pincode, addresses, checkServiceability]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    const res = await addAddress(newAddress);
    if (res.success && res.addresses?.length > 0) {
      const added = res.addresses[res.addresses.length - 1];
      setSelectedAddressId(added._id);
      setShowNewAddressForm(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Determine shipping address
    let shippingAddress = null;
    if (showNewAddressForm) {
      if (!newAddress.fullName || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.pincode) {
        toast.error('Please complete your delivery address form');
        return;
      }
      shippingAddress = newAddress;
    } else {
      shippingAddress = addresses.find((a) => a._id === selectedAddressId);
    }

    if (!shippingAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }

    if (serviceability.serviceable === false) {
      toast.error(
        `Sorry, delivery is not available to PIN code ${shippingAddress.pincode}. Please choose a serviceable address in Lucknow.`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        items: items.map((i) => ({
          product: i.product?._id || i.product,
          quantity: i.quantity,
          name: i.product?.name,
          image: i.product?.image,
          price: i.product?.sellingPrice ?? i.product?.discountedPrice ?? i.price,
          unit: i.product?.unit || i.unit,
        })),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state || 'Uttar Pradesh',
          pincode: shippingAddress.pincode,
          landmark: shippingAddress.landmark || '',
          addressType: shippingAddress.addressType || 'Home',
        },
        deliverySlot: {
          date: deliveryType === 'express' ? 'Today' : selectedSlot.date,
          timeWindow: deliveryType === 'express' ? 'Express (10–15 mins)' : selectedSlot.timeWindow,
        },
        deliveryType,
        estimatedDeliveryMinutes: deliveryType === 'express' ? 15 : 120,
        paymentMethod,
        couponCode: coupon?.code || undefined,
      };

      const res = await orderAPI.createOrder(orderPayload);

      if (res.success && res.data) {
        const order = res.data;
        clearCart();

        if (paymentMethod === 'stripe') {
          toast.info('Connecting to Stripe Checkout...');
          const sessionRes = await paymentAPI.createCheckoutSession(order._id);
          if (sessionRes.success && sessionRes.url) {
            window.location.href = sessionRes.url;
            return;
          }
        }

        toast.success('Order placed successfully!');
        navigate(`/order-success/${order._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please check stock or details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Checkout &amp; Delivery Schedule
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review your delivery destination, speed preference, and payment option
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Steps */}
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: Delivery Address */}
          <section className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900 font-black text-base">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  1
                </div>
                <span>Delivery Address</span>
              </div>
              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Saved Addresses list */}
            {!showNewAddressForm && addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-gray-800">
                            {addr.addressType || 'Home'}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="font-bold text-sm text-gray-900">{addr.fullName}</div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.pincode}
                        </div>
                        <div className="text-xs font-medium text-gray-500">Phone: {addr.phone}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Address Form */}
            {showNewAddressForm && (
              <form onSubmit={handleAddNewAddress} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Flat, House no., Building, Company, Apartment *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })
                      }
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    Save &amp; Deliver Here
                  </button>
                </div>
              </form>
            )}

            {/* Serviceability Banner */}
            {serviceability.serviceable ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ✓ Serviceable in <strong>{serviceability.zone?.locality || 'Lucknow zone'}</strong> (Express
                    available)
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  Serviceable
                </span>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Sorry! Delivery is not currently available at this PIN code. Please select a Lucknow PIN
                    (e.g. 226016, 226010, 226001).
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                  Unserviceable
                </span>
              </div>
            )}
          </section>

          {/* STEP 2: Delivery Speed & Slot Selection */}
          <section className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-gray-900 font-black text-base pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                2
              </div>
              <span>Delivery Speed &amp; Schedule</span>
            </div>

            {/* 10-Minute Express vs Standard Speed Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div
                onClick={() => setDeliveryType('express')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryType === 'express'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-black text-xs text-emerald-950">
                    <span className="text-amber-500 text-sm">⚡</span>
                    <span>10-Minute Express Delivery</span>
                  </div>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    FASTEST
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Doorstep arrival in 10–15 mins &bull;{' '}
                  {subtotal >= 699 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    '₹39 fee (Free above ₹699)'
                  )}
                </p>
              </div>

              <div
                onClick={() => setDeliveryType('standard')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryType === 'standard'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-black text-xs text-gray-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Standard Scheduled Delivery</span>
                  </div>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    REGULAR
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Select flexible delivery slots &bull;{' '}
                  {subtotal >= 499 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    '₹25 fee (Free above ₹499)'
                  )}
                </p>
              </div>
            </div>

            {/* Standard delivery slot cards (if standard selected) */}
            {deliveryType === 'standard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {DELIVERY_SLOTS.slice(1).map((slot) => {
                  const isSelected = selectedSlot.id === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/30'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs font-black text-gray-900">{slot.date}</span>
                          {slot.badge && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                              {slot.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{slot.timeWindow}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* STEP 3: Payment Method */}
          <section className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-gray-900 font-black text-base pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                3
              </div>
              <span>Payment Option</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stripe Card/UPI Option */}
              <div
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-gray-900 font-bold text-sm">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>Cards, UPI &amp; NetBanking</span>
                  </div>
                  {paymentMethod === 'stripe' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Pay securely using Stripe Checkout with Visa, Mastercard, RuPay, UPI, or NetBanking.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block">
                  ⚡ Stripe 256-bit Secure
                </div>
              </div>

              {/* Cash On Delivery Option */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-gray-900 font-bold text-sm">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  {paymentMethod === 'cod' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Pay with Cash or UPI to the delivery executive upon arrival at your doorstep.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block">
                  Zero advance payment required
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right 1 Column: Checkout Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-5 sticky top-28">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Order Items ({itemCount})
            </h3>

            {/* Quick list of items */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
              {items.map((i) => (
                <div key={i.product?._id || i._id} className="flex items-center justify-between text-xs">
                  <div className="truncate max-w-[170px]">
                    <span className="font-bold text-gray-800">{i.product?.name}</span>
                    <span className="text-gray-400 ml-1">x{i.quantity}</span>
                  </div>
                  <span className="font-black text-gray-900">
                    ₹{(i.product?.sellingPrice ?? i.product?.discountedPrice ?? i.price) * i.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>MRP Total</span>
                <span className="font-semibold text-gray-700">₹{totalMRP}</span>
              </div>
              {productSavings > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Product Discount</span>
                  <span>- ₹{productSavings}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span className="font-bold text-gray-900">Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal}</span>
              </div>
              {coupon && (couponSavings > 0 || couponDiscount > 0) && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({coupon.code})</span>
                  <span>- ₹{couponSavings || couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge ({deliveryType === 'express' ? '⚡ Express' : 'Standard'})</span>
                <span className="font-bold text-gray-900">
                  {calculatedDeliveryFee === 0 ? 'FREE' : `₹${calculatedDeliveryFee}`}
                </span>
              </div>
            </div>

            {/* Final Total */}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-gray-900">Final Payable</span>
              <span className="text-2xl font-black text-emerald-950">₹{currentTotalAmount}</span>
            </div>

            {/* Highlighted Savings Banner */}
            {calculatedTotalSavings > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                🎉 You are saving ₹{calculatedTotalSavings} on this order!
              </div>
            )}

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !serviceability.serviceable}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-gray-400 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              {isSubmitting ? (
                <span>Securing Order...</span>
              ) : !serviceability.serviceable ? (
                <span>PIN CODE NOT SERVICEABLE</span>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'stripe' ? 'PROCEED TO STRIPE PAYMENT' : 'CONFIRM & PLACE ORDER'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-gray-400 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified encrypted transaction &bull; BasketBee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
