import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if token exists (supports basketbee_token with fallback to freshly_token)
API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('basketbee_token') ||
      localStorage.getItem('freshly_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  sendOTP: (phone) => API.post('/auth/send-otp', { phone }),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  addAddress: (address) => API.post('/auth/address', address),
  updateAddress: (id, address) => API.put(`/auth/address/${id}`, address),
  deleteAddress: (id) => API.delete(`/auth/address/${id}`),
  setDefaultAddress: (id) => API.put(`/auth/address/${id}/default`),
  getWishlist: () => API.get('/auth/wishlist'),
  toggleWishlist: (productId) => API.post(`/auth/wishlist/${productId}`),
};

// Products endpoints
export const productAPI = {
  getProducts: (params) => API.get('/products', { params }),
  getFeatured: () => API.get('/products/featured'),
  search: (q) => API.get('/products/search', { params: { q } }),
  getSuggestions: (q) => API.get('/products/search/suggestions', { params: { q } }),
  getByCategory: (categoryId) => API.get(`/products/category/${categoryId}`),
  getByIdOrSlug: (idOrSlug) => API.get(`/products/${idOrSlug}`),
  createProduct: (data) => API.post('/products', data),
  updateProduct: (id, data) => API.put(`/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/products/${id}`),
  getReviews: (id) => API.get(`/products/${id}/reviews`),
  addReview: (id, reviewData) => API.post(`/products/${id}/reviews`, reviewData),
};

// Categories endpoints
export const categoryAPI = {
  getCategories: () => API.get('/categories'),
  getById: (idOrSlug) => API.get(`/categories/${idOrSlug}`),
  getBySlug: (slug) => API.get(`/categories/${slug}`),
  createCategory: (data) => API.post('/categories', data),
  updateCategory: (id, data) => API.put(`/categories/${id}`, data),
  deleteCategory: (id, params) => API.delete(`/categories/${id}`, { params }),
};

// Cart endpoints
export const cartAPI = {
  getCart: () => API.get('/cart'),
  addToCart: (productId, quantity) => API.post('/cart/add', { productId, quantity }),
  updateQuantity: (productId, quantity) => API.put('/cart/update', { productId, quantity }),
  removeItem: (productId) => API.delete(`/cart/item/${productId}`),
  clearCart: () => API.delete('/cart/clear'),
  syncCart: (items) => API.post('/cart/sync', { items }),
};

// Orders endpoints
export const orderAPI = {
  createOrder: (orderData) => API.post('/orders', orderData),
  getMyOrders: () => API.get('/orders/my-orders'),
  getOrderById: (id) => API.get(`/orders/${id}`),
  cancelOrder: (id) => API.put(`/orders/${id}/cancel`),
  getAllOrders: (params) => API.get('/orders', { params }),
  updateOrderStatus: (id, data) => API.put(`/orders/${id}/status`, data),
};

// Coupons endpoints
export const couponAPI = {
  getCoupons: () => API.get('/coupons'),
  validateCoupon: (code, orderAmount) => API.post('/coupons/validate', { code, orderAmount }),
  createCoupon: (data) => API.post('/coupons', data),
  deleteCoupon: (id) => API.delete(`/coupons/${id}`),
};

// Payment endpoints
export const paymentAPI = {
  createCheckoutSession: (orderId) => API.post('/payment/create-checkout-session', { orderId }),
  verifyPayment: (orderId, sessionId) => API.post('/payment/verify', { orderId, sessionId }),
};

// Admin endpoints
export const adminAPI = {
  getDashboardStats: () => API.get('/admin/dashboard'),
};

// Delivery serviceability endpoints
export const deliveryAPI = {
  checkPincode: (pincode) => API.get(`/delivery/check/${pincode}`),
  checkServiceabilityPost: (pincode) => API.post('/delivery/check-serviceability', { pincode }),
  getOptions: (pincode) => API.get('/delivery/options', { params: { pincode } }),
  getServiceableZones: () => API.get('/delivery/serviceable'),
  getAllZones: () => API.get('/delivery/zones'),
  createZone: (data) => API.post('/delivery/zones', data),
  updateZone: (id, data) => API.put(`/delivery/zones/${id}`, data),
  deleteZone: (id) => API.delete(`/delivery/zones/${id}`),
};

export default API;
