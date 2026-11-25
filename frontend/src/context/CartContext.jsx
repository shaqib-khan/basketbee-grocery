import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI, couponAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('basketbee_cart_items') || localStorage.getItem('freshly_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);

  // 1. Total MRP of all items in cart
  const totalMRP = items.reduce((sum, item) => {
    const orig = Number(item.product?.mrp ?? item.product?.originalPrice ?? item.product?.sellingPrice ?? item.product?.discountedPrice ?? item.price ?? 0);
    return sum + (orig * item.quantity);
  }, 0);

  // 2. Subtotal after product discounts (Selling Price total)
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.product?.sellingPrice ?? item.product?.discountedPrice ?? item.price ?? 0);
    return sum + (price * item.quantity);
  }, 0);

  // 3. Product Savings = Total MRP - Total Selling Price
  const productSavings = Math.max(0, totalMRP - subtotal);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // 4. Delivery Rule: Free if subtotal >= 499 or if coupon gives free delivery, else ₹25
  const isFreeDeliveryEligible = subtotal >= 499 || (coupon && (coupon.code === 'FREESHIP' || coupon.discountType === 'free_shipping'));
  const deliveryFee = (subtotal === 0 || isFreeDeliveryEligible) ? 0 : 25;

  // 5. Coupon Discount Calculation
  let couponDiscount = 0;
  if (coupon && subtotal >= (coupon.minimumOrderAmount ?? coupon.minOrderValue ?? 0)) {
    const type = coupon.discountType || (coupon.discountPercent ? 'percentage' : 'flat');
    if (type === 'flat') {
      couponDiscount = Number(coupon.discountValue ?? coupon.discountPercent ?? 0);
    } else if (type === 'percentage') {
      const rate = Number(coupon.discountValue ?? coupon.discountPercent ?? 0);
      let disc = Math.round((subtotal * rate) / 100);
      const cap = Number(coupon.maximumDiscount ?? coupon.maxDiscount);
      if (cap && disc > cap) {
        disc = cap;
      }
      couponDiscount = disc;
    } else if (type === 'free_shipping' || coupon.code === 'FREESHIP') {
      couponDiscount = 25;
    }
  }

  // 6. Total Amount Calculation
  const effectiveCouponDeduction = (coupon && (coupon.discountType === 'free_shipping' || coupon.code === 'FREESHIP'))
    ? 0
    : couponDiscount;
  const totalAmount = Math.max(0, subtotal - effectiveCouponDeduction + deliveryFee);

  // 7. Total Savings = Product Savings + Coupon Savings (excludes delivery charge per spec)
  const couponSavings = coupon ? (coupon.discountType === 'free_shipping' ? 25 : couponDiscount) : 0;
  const totalSavings = productSavings + couponSavings;

  // Sync with backend on auth state change
  const fetchCartFromBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      if (res.success && res.data) {
        setItems(res.data.items || []);
        localStorage.setItem('basketbee_cart_items', JSON.stringify(res.data.items || []));
      }
    } catch (err) {
      console.warn('Error fetching cart from backend:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Sync local items if any exist
      const local = localStorage.getItem('basketbee_cart_items') || localStorage.getItem('freshly_cart_items');
      const parsed = local ? JSON.parse(local) : [];
      if (parsed.length > 0) {
        cartAPI
          .syncCart(
            parsed.map((i) => ({
              product: i.product?._id || i.product,
              quantity: i.quantity,
            }))
          )
          .then((res) => {
            if (res.success) {
              setItems(res.data.items);
            }
          })
          .catch(() => fetchCartFromBackend());
      } else {
        fetchCartFromBackend();
      }
    }
  }, [isAuthenticated, fetchCartFromBackend]);

  // Persist guest cart to localStorage
  useEffect(() => {
    localStorage.setItem('basketbee_cart_items', JSON.stringify(items));
  }, [items]);

  const addToCart = async (product, quantity = 1) => {
    const existingIndex = items.findIndex(
      (item) => (item.product?._id || item.product) === product._id
    );

    const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const requestedQty = currentQty + quantity;

    if (requestedQty > product.stock) {
      toast.error(`Only ${product.stock} units available in stock`);
      return false;
    }

    if (isAuthenticated) {
      try {
        const res = await cartAPI.addToCart(product._id, quantity);
        if (res.success) {
          setItems(res.data.items);
          return true;
        }
      } catch (err) {
        toast.error(err.message || 'Could not add to cart');
        return false;
      }
    } else {
      // Guest local update
      if (existingIndex > -1) {
        const updated = [...items];
        updated[existingIndex].quantity = requestedQty;
        setItems(updated);
      } else {
        setItems([
          ...items,
          {
            product,
            quantity,
            price: product.sellingPrice ?? product.discountedPrice,
            unit: product.unit,
          },
        ]);
      }
      return true;
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    const existingIndex = items.findIndex(
      (item) => (item.product?._id || item.product) === productId
    );

    if (existingIndex === -1) return;

    const prod = items[existingIndex].product;
    if (newQuantity > 0 && prod?.stock && newQuantity > prod.stock) {
      toast.error(`Only ${prod.stock} units available in stock`);
      return;
    }

    if (isAuthenticated) {
      try {
        const res = await cartAPI.updateQuantity(productId, newQuantity);
        if (res.success) {
          setItems(res.data.items);
        }
      } catch (err) {
        toast.error(err.message || 'Could not update quantity');
      }
    } else {
      if (newQuantity <= 0) {
        setItems(items.filter((_, idx) => idx !== existingIndex));
      } else {
        const updated = [...items];
        updated[existingIndex].quantity = newQuantity;
        setItems(updated);
      }
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await cartAPI.removeItem(productId);
        if (res.success) {
          setItems(res.data.items);
          toast.info('Item removed from cart');
        }
      } catch (err) {
        toast.error(err.message || 'Could not remove item');
      }
    } else {
      setItems(
        items.filter((item) => (item.product?._id || item.product) !== productId)
      );
      toast.info('Item removed from cart');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartAPI.clearCart();
      } catch (err) {
        console.warn('Error clearing backend cart:', err.message);
      }
    }
    setItems([]);
    setCoupon(null);
    localStorage.removeItem('basketbee_cart_items');
    localStorage.removeItem('freshly_cart_items');
  };

  const getItemQuantity = (productId) => {
    const item = items.find(
      (i) => (i.product?._id || i.product) === productId
    );
    return item ? item.quantity : 0;
  };

  const applyCouponCode = async (code) => {
    try {
      const res = await couponAPI.validateCoupon(code, subtotal);
      if (res.success && res.data) {
        setCoupon(res.data);
        toast.success(res.message || 'Coupon applied successfully!');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code');
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    toast.info('Coupon removed');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalMRP: Math.round(totalMRP * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        productSavings: Math.round(productSavings * 100) / 100,
        savings: Math.round(productSavings * 100) / 100,
        deliveryFee,
        coupon,
        couponDiscount,
        couponSavings,
        totalSavings: Math.round(totalSavings * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        isFreeDeliveryEligible,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        applyCouponCode,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

