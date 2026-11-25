import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('basketbee_user') || localStorage.getItem('freshly_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem('basketbee_token') || localStorage.getItem('freshly_token') || null
  );
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('otp'); // 'otp' | 'login' | 'register'
  const [redirectPath, setRedirectPath] = useState(null);
  const toast = useToast();

  const openAuthModal = (tab = 'otp', redirect = null) => {
    setAuthModalTab(tab);
    setRedirectPath(redirect);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('basketbee_user', JSON.stringify(res.data));
        localStorage.setItem('freshly_user', JSON.stringify(res.data));
        setWishlist(res.data.wishlist || []);
      }
    } catch (err) {
      console.warn('Session expired or error fetching profile:', err.message);
      if (err.message.includes('authorized') || err.message.includes('expired')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveAuthSession = (tokenVal, userData) => {
    setToken(tokenVal);
    setUser(userData);
    localStorage.setItem('basketbee_token', tokenVal);
    localStorage.setItem('basketbee_user', JSON.stringify(userData));
    // Fallback sync for backwards compatibility
    localStorage.setItem('freshly_token', tokenVal);
    localStorage.setItem('freshly_user', JSON.stringify(userData));
    if (userData.wishlist) {
      setWishlist(userData.wishlist);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.success && res.data) {
        const { token: receivedToken, ...userData } = res.data;
        saveAuthSession(receivedToken, userData);
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true, user: userData, redirect: redirectPath };
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      return { success: false, message: err.message };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await authAPI.register({ name, email, password, phone });
      if (res.success && res.data) {
        const { token: receivedToken, ...userData } = res.data;
        saveAuthSession(receivedToken, userData);
        toast.success(`Welcome to BasketBee, ${userData.name}!`);
        return { success: true, user: userData, redirect: redirectPath };
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      return { success: false, message: err.message };
    }
  };

  const sendOtp = async (phone) => {
    try {
      const res = await authAPI.sendOTP(phone);
      if (res.success) {
        toast.success(res.message || 'OTP sent successfully');
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
      return { success: false, message: err.message };
    }
  };

  const verifyOtp = async (data) => {
    try {
      const res = await authAPI.verifyOTP(data);
      if (res.success && res.data) {
        const { token: receivedToken, ...userData } = res.data;
        saveAuthSession(receivedToken, userData);
        setAuthModalOpen(false);
        toast.success(res.message || `Welcome to BasketBee, ${userData.name}!`);
        return { success: true, user: userData, isNewUser: res.data.isNewUser, redirect: redirectPath };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'OTP verification failed');
      return { success: false, message: err.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.success) {
        toast.success(res.message || 'Password reset link sent to your email');
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset');
      return { success: false, message: err.message };
    }
  };

  const resetPassword = async (data) => {
    try {
      const res = await authAPI.resetPassword(data);
      if (res.success) {
        toast.success(res.message || 'Password reset successfully. Please log in.');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Password reset failed');
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWishlist([]);
    localStorage.removeItem('basketbee_token');
    localStorage.removeItem('basketbee_user');
    localStorage.removeItem('freshly_token');
    localStorage.removeItem('freshly_user');
    toast.info('Logged out from BasketBee successfully');
  };

  const updateProfile = async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      if (res.success && res.data) {
        const updated = { ...user, ...res.data };
        setUser(updated);
        localStorage.setItem('basketbee_user', JSON.stringify(updated));
        localStorage.setItem('freshly_user', JSON.stringify(updated));
        toast.success('Profile updated successfully');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
      return { success: false, message: err.message };
    }
  };

  const addAddress = async (address) => {
    try {
      const res = await authAPI.addAddress(address);
      if (res.success && res.data) {
        setUser((prev) => ({ ...prev, addresses: res.data }));
        toast.success('Address added successfully');
        return { success: true, addresses: res.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add address');
      return { success: false, message: err.message };
    }
  };

  const updateAddress = async (id, address) => {
    try {
      const res = await authAPI.updateAddress(id, address);
      if (res.success && res.data) {
        setUser((prev) => ({ ...prev, addresses: res.data }));
        toast.success('Address updated successfully');
        return { success: true, addresses: res.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update address');
      return { success: false, message: err.message };
    }
  };

  const deleteAddress = async (id) => {
    try {
      const res = await authAPI.deleteAddress(id);
      if (res.success && res.data) {
        setUser((prev) => ({ ...prev, addresses: res.data }));
        toast.success('Address deleted successfully');
        return { success: true, addresses: res.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete address');
      return { success: false, message: err.message };
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const res = await authAPI.setDefaultAddress(id);
      if (res.success && res.data) {
        setUser((prev) => ({ ...prev, addresses: res.data }));
        toast.success('Default address updated');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to set default address');
      return { success: false, message: err.message };
    }
  };

  const toggleWishlist = async (productId) => {
    if (!token) {
      openAuthModal('otp');
      toast.info('Please log in to manage your wishlist');
      return;
    }
    try {
      const res = await authAPI.toggleWishlist(productId);
      if (res.success && res.data) {
        setWishlist(res.data);
        const added = res.data.includes(productId);
        if (added) {
          toast.success('Added to wishlist');
        } else {
          toast.info('Removed from wishlist');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update wishlist');
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((id) => (typeof id === 'object' ? id._id === productId : id === productId));
  };

  const value = {
    user,
    token,
    loading,
    wishlist,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    authModalOpen,
    authModalTab,
    redirectPath,
    setAuthModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    toggleWishlist,
    isInWishlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
