import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import cloudinaryRoutes from './routes/cloudinary.js';
import chatRoutes from './routes/chat.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';

// Load environment variables
dotenv.config({ path: '.env.node' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images (fallback for local storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';
    const DB_NAME = process.env.DB_NAME || 'trustfhone_db';
    
    await mongoose.connect(`${MONGO_URL}${DB_NAME}`);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TrustFhone Delhi API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TrustFhone Delhi server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

export default app;
