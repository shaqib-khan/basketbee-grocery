import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper to compute summary
const calculateCartTotals = (cart) => {
  let subtotal = 0;
  let savings = 0;

  const validItems = [];

  for (const item of cart.items) {
    if (item.product) {
      const discounted = item.product.sellingPrice ?? item.product.discountedPrice ?? item.price;
      const original = item.product.mrp ?? item.product.originalPrice ?? discounted;

      subtotal += discounted * item.quantity;
      if (original > discounted) {
        savings += (original - discounted) * item.quantity;
      }
      validItems.push(item);
    }
  }

  cart.items = validItems;

  // Free delivery threshold: ₹500 / $25
  const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const totalAmount = subtotal + deliveryFee;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    deliveryFee,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name slug brand image originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock',
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const totals = calculateCartTotals(cart);

    res.json({
      success: true,
      data: {
        _id: cart._id,
        items: cart.items,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this product is currently out of stock',
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    const newQty = existingIndex > -1 ? cart.items[existingIndex].quantity + Number(quantity) : Number(quantity);

    if (newQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock. Cannot add more.`,
      });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.discountedPrice;
    } else {
      cart.items.push({
        product: product._id,
        quantity: newQty,
        price: product.discountedPrice,
        unit: product.unit,
      });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug brand image originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock',
    });

    const totals = calculateCartTotals(populatedCart);

    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        _id: populatedCart._id,
        items: populatedCart.items,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart',
      });
    }

    const product = await Product.findById(productId);

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      if (product && quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available in stock.`,
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug brand image originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock',
    });

    const totals = calculateCartTotals(populatedCart);

    res.json({
      success: true,
      message: 'Cart updated',
      data: {
        _id: populatedCart._id,
        items: populatedCart.items,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productId
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug brand image originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock',
    });

    const totals = calculateCartTotals(populatedCart);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        _id: populatedCart._id,
        items: populatedCart.items,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items in cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart emptied successfully',
      data: {
        items: [],
        subtotal: 0,
        savings: 0,
        deliveryFee: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync local cart items upon login
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const item of items) {
      const prod = await Product.findById(item.product);
      if (prod && prod.stock > 0) {
        const existingIdx = cart.items.findIndex(
          (ci) => ci.product.toString() === item.product
        );
        const qtyToAdd = Math.min(item.quantity, prod.stock);

        if (existingIdx > -1) {
          cart.items[existingIdx].quantity = Math.min(
            cart.items[existingIdx].quantity + qtyToAdd,
            prod.stock
          );
        } else {
          cart.items.push({
            product: prod._id,
            quantity: qtyToAdd,
            price: prod.discountedPrice,
            unit: prod.unit,
          });
        }
      }
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug brand image originalPrice discountedPrice discountPercent mrp sellingPrice discountPercentage unit stock',
    });

    const totals = calculateCartTotals(populatedCart);

    res.json({
      success: true,
      data: {
        _id: populatedCart._id,
        items: populatedCart.items,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

