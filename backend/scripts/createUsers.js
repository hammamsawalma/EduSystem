const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@education.com' });
    if (!existingAdmin) {
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
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create teacher user
    const existingTeacher = await User.findOne({ email: 'teacher@education.com' });
    if (!existingTeacher) {
      const teacher = new User({
        email: 'teacher@education.com',
        password: 'teacher123',
        role: 'teacher',
        profile: {
          firstName: 'Demo',
          lastName: 'Teacher'
        },
        status: 'approved'
      });

      await teacher.save();
      console.log('✅ Teacher user created successfully');
      console.log('   Email: teacher@education.com');
      console.log('   Password: teacher123');
    } else {
      console.log('ℹ️ Teacher user already exists');
    }

    console.log('\n🎉 All users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
};

createUsers();
