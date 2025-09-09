const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@education.com' });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      email: 'admin@education.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator'
      },
      status: 'approved'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('   Email: admin@education.com');
    console.log('   Password: admin123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createAdmin();
