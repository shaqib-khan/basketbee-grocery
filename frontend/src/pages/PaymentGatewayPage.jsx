import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { orderAPI, paymentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];
const WALLETS = ['Paytm Wallet', 'Amazon Pay', 'PhonePe Wallet', 'Mobikwik'];

const PaymentGatewayPage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || `cs_test_mock_${Date.now()}`;
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [processing, setProcessing] = useState(false);
  const [failedState, setFailedState] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(599);

  // Method inputs
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [selectedWallet, setSelectedWallet] = useState(WALLETS[0]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await orderAPI.getOrderById(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
          setCardName(res.data.shippingAddress?.fullName || '');
        }
      } catch (err) {
        toast.error(err.message || 'Unable to load payment session');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, toast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCardNumberChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvv('123');
    setCardName(order?.shippingAddress?.fullName || 'Test Customer');
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    setFailedState(false);

    if (method === 'upi' && (!upiId.trim() || !upiId.includes('@'))) {
      toast.error('Please enter a valid UPI ID (e.g. mobile@upi or name@okicici)');
      return;
    }
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
        toast.error('Please enter valid card details (or click Fill Test Card)');
        return;
      }
    }

    try {
      setProcessing(true);
      // Simulate realistic bank authorization delay
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const res = await paymentAPI.verifyPayment(orderId, sessionId);
      if (res.success) {
        toast.success('Payment authorized & confirmed!');
        navigate(`/order-success/${orderId}?session_id=${sessionId}`);
      } else {
        setFailedState(true);
        toast.error(res.message || 'Payment verification failed');
      }
    } catch (err) {
      setFailedState(true);
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-gray-600">Initializing Secure Payment Gateway...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-black text-gray-900">Payment Session Not Found</h2>
        <button
          onClick={() => navigate('/orders')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-slate-100 py-8 px-4 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Top Merchant Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-emerald-900 flex items-center justify-center text-2xl shadow">
              🐝
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-lg tracking-tight">BasketBee Pay</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full">
                  Demo Gateway
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-mono">
                Order #{order.orderNumber} &bull; {order.items?.length} items
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:text-right gap-4">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-200 bg-emerald-800/70 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono font-bold">{formatTimer(secondsLeft)}</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">
                Payable Amount
              </div>
              <div className="text-2xl font-black text-white">₹{order.totalAmount}</div>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Method Selector */}
          <div className="md:col-span-4 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 pb-1">
              Payment Options
            </div>

            <button
              type="button"
              onClick={() => setMethod('upi')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                method === 'upi'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <div>
                <div>UPI (GPay / PhonePe)</div>
                <div className={`text-[10px] font-normal ${method === 'upi' ? 'text-emerald-100' : 'text-gray-400'}`}>
                  Instant via UPI ID
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                method === 'card'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <div>
                <div>Credit / Debit Card</div>
                <div className={`text-[10px] font-normal ${method === 'card' ? 'text-emerald-100' : 'text-gray-400'}`}>
                  Visa, Mastercard, RuPay
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('netbanking')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                method === 'netbanking'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <div>
                <div>NetBanking</div>
                <div className={`text-[10px] font-normal ${method === 'netbanking' ? 'text-emerald-100' : 'text-gray-400'}`}>
                  All Indian Banks
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('wallet')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                method === 'wallet'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <div>
                <div>Wallets</div>
                <div className={`text-[10px] font-normal ${method === 'wallet' ? 'text-emerald-100' : 'text-gray-400'}`}>
                  Paytm, Amazon Pay
                </div>
              </div>
            </button>
          </div>

          {/* Right Payment Form */}
          <form onSubmit={handlePayNow} className="md:col-span-8 p-6 space-y-5">
            {failedState && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Payment was declined or cancelled. You can retry below.</span>
              </div>
            )}

            {/* UPI */}
            {method === 'upi' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-900">Pay via UPI ID</h3>
                <div className="flex flex-wrap gap-2">
                  {['rahul@okicici', 'shopper@ybl', 'user@paytm'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setUpiId(sample)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold"
                    >
                      Use {sample}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Enter UPI ID / VPA *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            )}

            {/* Card */}
            {method === 'card' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900">Enter Card Details</h3>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    Fill Test Card (4242...)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Card Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Expiry (MM/YY) *</label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CVV *</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cardholder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Name on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {/* NetBanking */}
            {method === 'netbanking' && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-gray-900">Select Your Bank</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BANKS.map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between ${
                        selectedBank === bank
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{bank}</span>
                      {selectedBank === bank && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallets */}
            {method === 'wallet' && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-gray-900">Select Mobile Wallet</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {WALLETS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWallet(w)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between ${
                        selectedWallet === w
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{w}</span>
                      {selectedWallet === w && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Authorizing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>PAY ₹{order.totalAmount} NOW</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => navigate('/checkout')}
                  className="text-gray-500 hover:text-gray-800 font-semibold flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Checkout</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setFailedState(true)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Simulate Failed Payment
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit Encrypted Simulated Payment Gateway &bull; BasketBee</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayPage;

