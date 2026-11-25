import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Phone,
  UserCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = new URLSearchParams(location.search).get('redirect') || location.state?.from?.pathname || '/';

  // Mode: 'otp-phone' | 'otp-verify' | 'email'
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' | 'email'
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'verify'

  // Mobile OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputRefs = useRef([]);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (activeTab === 'otp' && otpStep === 'verify' && otpCountdown > 0) {
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
  }, [activeTab, otpStep, otpCountdown]);

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
      setOtpStep('verify');
      setOtpValues(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setCanResendOtp(false);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } else {
      setErrorMsg(res.message || 'Failed to send OTP.');
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

  // Handle OTP digit entry
  const handleOtpDigitChange = (index, val) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newArr = [...otpValues];
    newArr[index] = char;
    setOtpValues(newArr);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (char && index === 5 && newArr.every((d) => d !== '')) {
      handleVerifyOtp(newArr.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

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

  // Verify OTP
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
      if (res.user?.role === 'admin' && redirect === '/') {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    } else {
      setErrorMsg(res.message || 'Invalid or expired OTP.');
    }
  };

  // Handle Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      if (res.user?.role === 'admin' && redirect === '/') {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    } else {
      setErrorMsg(res.message || 'Login failed. Please check credentials.');
    }
  };

  const handleFillDemo = (type) => {
    setActiveTab('email');
    if (type === 'admin') {
      setEmail('admin@basketbee.com');
      setPassword('Admin@123');
    } else {
      setEmail('customer@basketbee.com');
      setPassword('Customer@123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-xl p-6 sm:p-8 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-200">
            <span className="text-2xl">🐝</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome to BasketBee
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to track orders, manage addresses, and enjoy 10-min express checkout
          </p>
        </div>

        {/* Tab Switcher: Customer Mobile OTP vs Admin / Email Login */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('otp');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'otp'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Customer (Mobile OTP)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'email'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin / Email Login</span>
          </button>
        </div>

        {/* Global Error/Success Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Role Guide / Quick Fill */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Two Login Modes</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('otp');
                setOtpStep('phone');
                setErrorMsg('');
              }}
              className="py-1.5 px-2 bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 font-bold rounded-xl transition-colors shadow-xs"
            >
              Customer (Mobile OTP)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="py-1.5 px-2 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black rounded-xl transition-colors shadow-xs"
            >
              Admin Login (Email)
            </button>
          </div>
        </div>

        {/* TAB 1: Mobile OTP */}
        {activeTab === 'otp' && (
          <div>
            {otpStep === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex rounded-xl border border-gray-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden bg-white">
                    <span className="inline-flex items-center px-3.5 bg-gray-50 border-r border-gray-300 text-xs font-bold text-gray-700 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      autoFocus
                      required
                      placeholder="10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-3.5 py-2.5 text-sm outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>CONTINUE WITH MOBILE OTP</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setOtpStep('phone')}
                  className="text-xs font-semibold text-gray-500 hover:text-emerald-700 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Mobile Number</span>
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Enter the 6-digit verification code sent to{' '}
                    <strong className="text-gray-900 font-mono">+91 {phoneNumber}</strong>
                  </p>
                </div>

                {/* Dev OTP Hint */}
                {devOtpHint && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 text-center animate-pulse">
                    <span>Dev OTP: </span>
                    <strong className="font-mono text-base px-2 py-0.5 bg-white rounded border border-amber-300 text-amber-900 tracking-wider">
                      {devOtpHint}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = String(devOtpHint).split('');
                        setOtpValues(digits);
                        handleVerifyOtp(devOtpHint);
                      }}
                      className="block mx-auto mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold"
                    >
                      Auto-Fill & Verify
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Your Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* 6 Individual Digit Boxes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 text-center">
                    Enter 6-Digit OTP
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-12 text-center text-lg font-black font-mono border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:bg-emerald-50/30 focus:outline-none transition-all shadow-xs"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpValues.some((d) => d === '')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>VERIFY & LOG IN</span>}
                </button>

                <div className="text-center pt-1">
                  {canResendOtp ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Didn't receive code? Resend OTP
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Resend OTP in <span className="font-mono font-bold text-gray-800">{otpCountdown}s</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Email & Password */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              {loading ? 'Signing In...' : 'SIGN IN TO BASKETBEE'}
            </button>
          </form>
        )}

        {/* Register Link */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Don&apos;t have an account yet?{' '}
          <Link
            to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-emerald-700 font-bold hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
