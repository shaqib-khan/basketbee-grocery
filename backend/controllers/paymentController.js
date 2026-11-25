import Stripe from 'stripe';
import Order from '../models/Order.js';

const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (secretKey && !secretKey.includes('placeholder') && !secretKey.includes('your_stripe')) {
    return new Stripe(secretKey);
  }
  return null;
};

// @desc    Create Stripe Checkout Session
// @route   POST /api/payment/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('user', 'email name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this order',
      });
    }

    const stripe = getStripeInstance();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (stripe) {
      // Map order items to Stripe line items
      const lineItems = order.items.map((item) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.name,
            images: item.image && item.image.startsWith('http') ? [item.image] : [],
            description: `${item.unit} | BasketBee Grocery`,
          },
          unit_amount: Math.round(item.price * 100), // in paise
        },
        quantity: item.quantity,
      }));

      // Add delivery fee line item if applicable
      if (order.deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Delivery Fee',
              description: 'Standard Grocery Delivery',
            },
            unit_amount: Math.round(order.deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: order.user.email,
        line_items: lineItems,
        success_url: `${clientUrl}/order-success/${order._id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/checkout?canceled=true&order_id=${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
      });

      order.stripeSessionId = session.id;
      await order.save();

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } else {
      // Development simulated Stripe test mode (when live Stripe key is not configured)
      const simulatedSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      order.stripeSessionId = simulatedSessionId;
      await order.save();

      return res.json({
        success: true,
        isSimulated: true,
        sessionId: simulatedSessionId,
        url: `${clientUrl}/payment-gateway/${order._id}?session_id=${simulatedSessionId}`,
        message: 'Simulated payment gateway initialized',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Stripe Payment status securely on server
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, sessionId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const stripe = getStripeInstance();

    if (stripe && sessionId && !sessionId.startsWith('cs_test_mock_')) {
      // Real Stripe session verification
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'Processing';
        order.stripePaymentIntentId = session.payment_intent;
        order.statusHistory.push({
          status: 'Processing',
          timestamp: new Date(),
          comment: `Payment verified via Stripe (Session: ${session.id})`,
        });

        await order.save();

        return res.json({
          success: true,
          message: 'Payment verified and confirmed',
          data: order,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment has not been completed',
          paymentStatus: session.payment_status,
        });
      }
    } else {
      // Test mode simulated confirmation
      order.paymentStatus = 'paid';
      order.orderStatus = 'Processing';
      order.stripePaymentIntentId = `pi_test_${Date.now()}`;
      order.statusHistory.push({
        status: 'Processing',
        timestamp: new Date(),
        comment: `Payment confirmed via Stripe Test Mode (${sessionId})`,
      });

      await order.save();

      return res.json({
        success: true,
        message: 'Payment verified successfully in Stripe test mode',
        data: order,
      });
    }
  } catch (error) {
    next(error);
  }
};

