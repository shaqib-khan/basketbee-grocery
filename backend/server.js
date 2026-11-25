// BasketBee Grocery Platform Server - Superfast Indian E-Commerce
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB, closeDB, getDBHealth } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';

// Seed runner helper
import { checkAndAutoSeed } from './seed/seed.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check route with database health verification
app.get('/api/health', (req, res) => {
  const dbHealth = getDBHealth();
  res.json({
    status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
    app: 'BasketBee Supermarket API',
    version: '2.0.0',
    database: dbHealth,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
let server = null;

const startServer = async () => {
  try {
    await connectDB();
    
    // Automatically seed sample data if empty
    await checkAndAutoSeed();

    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` 🐝 BasketBee Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(` API URL: http://localhost:${PORT}/api`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n======================================================`);
        console.error(`❌ PORT ${PORT} IS ALREADY OCCUPIED!`);
        console.error(`Another terminal or Node process is already running on port ${PORT}.`);
        console.error(`👉 Quick Fix: Run 'npx kill-port ${PORT}' or close the other running terminal.`);
        console.error(`======================================================\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start BasketBee server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
  if (server) {
    server.close();
  }
  await closeDB();
  process.exit(0);
};

process.once('SIGUSR2', async () => {
  if (server) server.close();
  await closeDB();
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

startServer();

export default app;
