import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendSMSOTP } from '../utils/smsService.js';

// In-memory OTP storage for unauthenticated phone numbers awaiting registration/verification
// Structure: { [phone]: { code, expiresAt, attempts, lastSentAt } }
const tempOtpStore = new Map();

// Helper to normalize Indian phone number (10 digits)
const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};

// @desc    Register a new user with Email & Password
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);

    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login.',
      });
    }

    if (cleanPhone) {
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this mobile number already exists.',
        });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: cleanPhone || '',
      role: 'customer',
      isEmailVerified: true,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to BasketBee.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user with Email & Password
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful! Welcome back to BasketBee.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to mobile number
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)',
      });
    }

    // Prevent Admin login via OTP (Admin uses Email & Password login)
    const user = await User.findOne({ phone: cleanPhone });
    if (user && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot log in via OTP. Please use the Admin Login (Email & Password).',
      });
    }

    // Rate limiting: 45 seconds cooldown between OTP requests for the same number
    const existingTemp = tempOtpStore.get(cleanPhone);
    if (existingTemp && Date.now() - existingTemp.lastSentAt < 45 * 1000) {
      const waitSec = Math.ceil((45 * 1000 - (Date.now() - existingTemp.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec} seconds before requesting a new OTP`,
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save in temp store
    tempOtpStore.set(cleanPhone, {
      code: otp,
      expiresAt,
      attempts: 0,
      lastSentAt: Date.now(),
    });

    // Also update on user record if user exists
    if (user) {
      user.phoneOtp = {
        code: otp,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      };
      await user.save({ validateBeforeSave: false });
    }

    // Send SMS via configured provider (or dev mock logger)
    const smsResult = await sendSMSOTP(cleanPhone, otp);

    res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      data: {
        phone: cleanPhone,
        isRegistered: Boolean(user),
        expiresIn: 300,
        devOtp: smsResult.devOtp, // Returned only in development mode for easy pair-testing
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and log in / register customer
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, name, email } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both mobile number and verification OTP',
      });
    }

    const storedOtpData = tempOtpStore.get(cleanPhone);
    let user = await User.findOne({ phone: cleanPhone }).select('+phoneOtp.code +phoneOtp.expiresAt +phoneOtp.attempts');

    if (user && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts must sign in using Email & Password on the Admin Login tab.',
      });
    }

    const expectedOtp = storedOtpData?.code || user?.phoneOtp?.code;
    const expiresAt = storedOtpData?.expiresAt || user?.phoneOtp?.expiresAt;

    if (!expectedOtp) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found for this number. Please request a new OTP.',
      });
    }

    if (new Date() > new Date(expiresAt)) {
      tempOtpStore.delete(cleanPhone);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please click Resend OTP.',
      });
    }

    // Check attempts limit (max 4 tries)
    const currentAttempts = (storedOtpData?.attempts || user?.phoneOtp?.attempts || 0) + 1;
    if (currentAttempts > 4) {
      tempOtpStore.delete(cleanPhone);
      return res.status(429).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a fresh OTP.',
      });
    }

    if (storedOtpData) storedOtpData.attempts = currentAttempts;

    // Verify OTP code match
    if (otp.toString().trim() !== expectedOtp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please enter the correct 6-digit code.',
      });
    }

    // OTP is valid! Clean up temp OTP store
    tempOtpStore.delete(cleanPhone);

    // If user already exists, complete login
    if (user) {
      user.isPhoneVerified = true;
      user.phoneOtp = undefined;
      await user.save({ validateBeforeSave: false });
    } else {
      // New Customer Registration via Mobile
      const customerName = (name && name.trim()) || `Customer ${cleanPhone.slice(-4)}`;
      const customerEmail = email && email.trim() ? email.trim().toLowerCase() : `user_${cleanPhone}@basketbee.in`;

      user = await User.create({
        name: customerName,
        email: customerEmail,
        phone: cleanPhone,
        isPhoneVerified: true,
        role: 'customer',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Mobile verification successful! Welcome to BasketBee.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Request reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address',
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email address was found',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    console.log('====================================================');
    console.log(`🔐 [FRESHLY PASSWORD RESET] Email: ${user.email}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
    console.log(`🔑 Token: ${resetToken}`);
    console.log('====================================================');

    res.json({
      success: true,
      message: 'Password reset link generated and sent.',
      data: {
        resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
        resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and your new password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Password has been reset successfully! You are now logged in.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: authToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile (GET /api/auth/me)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'wishlist',
      'name slug brand originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock image rating'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  return getMe(req, res, next);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.phone !== undefined) user.phone = normalizePhone(req.body.phone);
    if (req.body.avatar) user.avatar = req.body.avatar;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADDRESS MANAGEMENT (Full CRUD)
// ==========================================

// @desc    Add delivery address
// @route   POST /api/auth/address
// @access  Private
export const addAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      houseNumber = '',
      buildingName = '',
      street,
      city = 'Lucknow',
      state = 'Uttar Pradesh',
      pincode,
      landmark = '',
      addressType = 'Home',
      isDefault = false,
    } = req.body;

    if (!fullName || !phone || !street || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, mobile number, street/area, and PIN code',
      });
    }

    const user = await User.findById(req.user._id);

    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      fullName: fullName.trim(),
      phone: normalizePhone(phone),
      houseNumber: houseNumber.trim(),
      buildingName: buildingName.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark.trim(),
      addressType,
      isDefault: isDefault || user.addresses.length === 0,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing delivery address
// @route   PUT /api/auth/address/:addressId
// @access  Private
export const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    const fields = [
      'fullName',
      'phone',
      'houseNumber',
      'buildingName',
      'street',
      'city',
      'state',
      'pincode',
      'landmark',
      'addressType',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        address[f] = req.body[f];
      }
    });

    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete delivery address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );

    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address removed successfully',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set default delivery address
// @route   PUT /api/auth/address/:addressId/default
// @access  Private
export const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let found = false;
    user.addresses.forEach((addr) => {
      if (addr._id.toString() === req.params.addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Default address updated',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// WISHLIST
// ==========================================

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.wishlist.indexOf(productId);
    let added = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      added = false;
    } else {
      user.wishlist.push(productId);
      added = true;
    }

    await user.save();

    res.json({
      success: true,
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
      data: {
        wishlist: user.wishlist,
        added,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name slug brand originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock image rating numReviews categoryName',
    });

    res.json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};
