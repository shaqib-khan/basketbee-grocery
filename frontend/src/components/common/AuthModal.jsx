import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  RotateCcw,
  Sparkles,
  Zap,
  ShoppingBag,
} from 'lucide-react';

const AuthModal = () => {
  const {
    authModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    redirectPath,
    sendOtp,
    verifyOtp,
    login,
    register,
    forgotPassword,
  } = useAuth();

  const navigate = useNavigate();

  // Mode: 'otp-phone' | 'otp-verify' | 'email-login' | 'email-register' | 'forgot-password'
  const [mode, setMode] = useState('otp-phone');

  // Mobile OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputRefs = useRef([]);

  // Sync mode with context authModalTab on open
  useEffect(() => {
    if (authModalOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (authModalTab === 'login') {
        setMode('email-login');
      } else if (authModalTab === 'register') {
        setMode('email-register');
      } else {
        setMode('otp-phone');
      }
    }
  }, [authModalOpen, authModalTab]);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (mode === 'otp-verify' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, otpCountdown]);

  if (!authModalOpen) return null;

  const handlePostAuthRedirect = (loggedInUser) => {
    closeAuthModal();
    if (loggedInUser?.role === 'admin') {
      navigate('/admin');
    } else if (redirectPath) {
      navigate(redirectPath);
    }
  };

  // Quick fill demo user
  const handleQuickFill = (phone, name = 'Customer') => {
    setPhoneNumber(phone);
    setUserName(name);
    setErrorMsg('');
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    const formatted = `+91 ${clean}`;
    const res = await sendOtp(formatted);
    setLoading(false);

    if (res.success) {
      setMode('otp-verify');
      setOtpValues(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setCanResendOtp(false);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } else {
      setErrorMsg(res.message || 'Failed to send OTP. Please try again.');
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setErrorMsg('');
    setLoading(true);
    const formatted = `+91 ${phoneNumber.replace(/\D/g, '')}`;
    const res = await sendOtp(formatted);
    setLoading(false);

    if (res.success) {
      setOtpValues(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setCanResendOtp(false);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
      setSuccessMsg('New OTP sent successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.message || 'Failed to resend OTP.');
    }
  };

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index, val) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newArr = [...otpValues];
    newArr[index] = char;
    setOtpValues(newArr);

    // Auto-focus next input box if typed
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    if (char && index === 5 && newArr.every((d) => d !== '')) {
      handleVerifyOtp(newArr.join(''));
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle full OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newArr = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newArr[i] = pasted[i] || '';
      }
      setOtpValues(newArr);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();

      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpValues.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const formatted = `+91 ${phoneNumber.replace(/\D/g, '')}`;
    const res = await verifyOtp({
      phone: formatted,
      otp: code,
      name: userName || undefined,
    });
    setLoading(false);

    if (res.success) {
      handlePostAuthRedirect(res.user);
    } else {
      setErrorMsg(res.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  // Handle Email Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res?.success) {
      handlePostAuthRedirect(res.user);
    } else {
      setErrorMsg(res?.message || 'Login failed. Please check your credentials.');
    }
  };

  // Handle Email Register
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const res = await register(
      userName,
      email,
      password,
      phoneNumber ? `+91 ${phoneNumber.replace(/\D/g, '')}` : undefined
    );
    setLoading(false);

    if (res?.success) {
      handlePostAuthRedirect(res.user);
    } else {
      setErrorMsg(res?.message || 'Registration failed.');
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);

    if (res?.success) {
      setSuccessMsg('Password reset instructions have been sent to your email.');
    } else {
      setErrorMsg(res?.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full overflow-hidden border border-gray-100 flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-20 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-xs shadow-xs"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: BigBasket-Inspired Value Proposition (Light/Greenish) */}
        <div className="w-full md:w-5/12 bg-linear-to-b from-emerald-50 via-teal-50/60 to-emerald-100/50 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-emerald-100/70">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center space-x-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                <span className="text-xl">🐝</span>
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-emerald-950 leading-none">
                  Basket<span className="text-emerald-600">Bee</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">
                  Your Daily Grocery
                </div>
              </div>
            </div>

            <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wider mb-4">
              Why choose BasketBee?
            </h4>

            {/* Value Pillars */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white text-emerald-700 shadow-xs shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Quality Guaranteed</div>
                  <div className="text-[11px] text-gray-500 leading-snug">
                    Handpicked farm-fresh fruits, vegetables & premium staples.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white text-emerald-700 shadow-xs shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">10-Minute Express Delivery</div>
                  <div className="text-[11px] text-gray-500 leading-snug">
                    Lightning fast delivery straight to your kitchen table.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white text-emerald-700 shadow-xs shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Easy Returns</div>
                  <div className="text-[11px] text-gray-500 leading-snug">
                    No questions asked return or replacement at doorstep.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white text-emerald-700 shadow-xs shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Free Doorstep Delivery</div>
                  <div className="text-[11px] text-gray-500 leading-snug">
                    Zero delivery fee on qualifying supermarket orders.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom App Download & Assurance Badges */}
          <div className="mt-6 pt-4 border-t border-emerald-200/50">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
              Get the BasketBee App
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-lg flex items-center space-x-1 shadow-xs">
                <span>Google Play</span>
              </div>
              <div className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-lg flex items-center space-x-1 shadow-xs">
                <span>App Store</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: BigBasket-Style Login / Sign up Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center space-x-2">
              {mode !== 'otp-phone' && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setMode('otp-phone');
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {mode === 'otp-verify'
                  ? 'Verify Mobile OTP'
                  : mode === 'email-login'
                  ? 'Admin / Email Login'
                  : mode === 'email-register'
                  ? 'Create Customer Account'
                  : mode === 'forgot-password'
                  ? 'Reset Password'
                  : 'Customer Login / Sign up'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {mode === 'otp-phone' && 'Enter your real 10-digit mobile number to receive a 6-digit OTP'}
              {mode === 'otp-verify' && `Enter the 6-digit OTP sent to +91 ${phoneNumber}`}
              {mode === 'email-login' && 'For Store Admins (manage catalog & orders) or Email Customers'}
              {mode === 'email-register' && 'Sign up with your Gmail / Email (password secured with bcrypt)'}
              {mode === 'forgot-password' && 'We will send a reset password link to your email'}
            </p>
          </div>

          {/* Quick 3-Way Mode Switcher */}
          {mode !== 'otp-verify' && mode !== 'forgot-password' && (
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold mb-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('otp-phone');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'otp-phone' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('email-register');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'email-register' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Sign Up (Gmail)
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('email-login');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'email-login' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Admin / Email
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* MODE 1: OTP PHONE NUMBER INPUT */}
          {mode === 'otp-phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex rounded-xl border border-gray-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all overflow-hidden bg-white">
                  <div className="flex items-center px-3.5 bg-gray-50 border-r border-gray-200 text-xs font-bold text-gray-700 select-none">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3.5 py-3 text-sm font-semibold text-gray-900 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Name <span className="text-gray-400 font-normal lowercase">(optional for new user)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>

              <div className="pt-2 pb-1 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-950 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-800">
                    Store Administrator?
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Manage products, orders, categories &amp; zones
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('email-login');
                  }}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors"
                >
                  Admin Login &rarr;
                </button>
              </div>

              {/* Legal Terms */}
              <p className="text-[10px] text-gray-400 text-center leading-normal pt-2">
                By continuing, you agree to BasketBee&apos;s{' '}
                <a href="#terms" className="underline hover:text-gray-600">Terms of Service</a> &amp;{' '}
                <a href="#privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
              </p>
            </form>
          )}

          {/* MODE 2: OTP 6-DIGIT VERIFICATION */}
          {mode === 'otp-verify' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-600">Sent code to: </span>
                  <span className="font-bold text-gray-900">+91 {phoneNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('otp-phone')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              {devOtpHint && (
                <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-900 flex items-center justify-between">
                  <span>Demo OTP auto-detected: <strong className="font-mono text-sm">{devOtpHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const arr = devOtpHint.split('');
                      setOtpValues(arr);
                      handleVerifyOtp(devOtpHint);
                    }}
                    className="px-2 py-0.5 bg-yellow-400 text-gray-950 font-bold rounded text-[11px]"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {/* 6-box input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit OTP
                </label>
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-black text-gray-900 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all shadow-xs"
                    />
                  ))}
                </div>
              </div>

              {/* Countdown & Resend */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Didn&apos;t receive code?</span>
                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="font-mono font-medium text-gray-400">
                    Resend in {otpCountdown}s
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otpValues.some((d) => d === '')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Verify &amp; Continue</span>
                )}
              </button>
            </div>
          )}

          {/* MODE 3: EMAIL & PASSWORD LOGIN */}
          {mode === 'email-login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-medium focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo auto-fill */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@basketbee.com');
                    setPassword('Customer@123');
                  }}
                  className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-bold text-gray-700"
                >
                  Fill Demo Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@basketbee.com');
                    setPassword('Admin@123');
                  }}
                  className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-bold text-gray-700"
                >
                  Fill Demo Admin
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setMode('otp-phone')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  &larr; Use Mobile OTP instead
                </button>
                <button
                  type="button"
                  onClick={() => setMode('email-register')}
                  className="font-bold text-gray-800 hover:text-emerald-700"
                >
                  New here? Register &rarr;
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: REGISTER */}
          {mode === 'email-register' && (
            <form onSubmit={handleEmailRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Gmail / Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Confirm
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Match password"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
              </button>

              <div className="text-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode('email-login')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Already have an account? Sign in &rarr;
                </button>
              </div>
            </form>
          )}

          {/* MODE 5: FORGOT PASSWORD */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Reset Link</span>}
              </button>

              <div className="text-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setMode('email-login')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
