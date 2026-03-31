import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config({ path: '.env.node' });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';
const DB_NAME = process.env.DB_NAME || 'trustfhone_db';

const seedAdmin = async () => {
  try {
    await mongoose.connect(`${MONGO_URL}${DB_NAME}`);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@trustfhone.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'Admin User',
      email: 'admin@trustfhone.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      verificationBadge: true
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@trustfhone.com');
    console.log('🔑 Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
