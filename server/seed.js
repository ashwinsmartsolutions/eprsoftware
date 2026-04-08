const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Franchise = require('./models/Franchise');

require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB with Atlas-compatible options
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log('Connected to MongoDB Atlas');

    // Clear existing data
    await User.deleteMany({});
    await Franchise.deleteMany({});
    console.log('Cleared existing data');

    // Create Owner user - pass plain password, User model will hash it
    const owner = new User({
      username: 'admin',
      email: 'admin@epr.com',
      password: 'admin123',
      role: 'owner'
    });
    await owner.save();
    console.log('Created owner user');

    // Create demo franchise with zero stock (model defaults handle this)
    const demoFranchise = new Franchise({
      name: 'Demo Franchise',
      email: 'dist@epr.com',
      phone: '+1234567890',
      address: '123 Main St, City, State'
    });
    await demoFranchise.save();
    console.log('Created demo franchise');

    // Create franchise user - pass plain password, User model will hash it
    const franchiseUser = new User({
      username: 'demo_franchise',
      email: 'dist@epr.com',
      password: 'dist123',
      role: 'franchise',
      franchiseId: demoFranchise._id
    });
    await franchiseUser.save();
    console.log('Created franchise user');

    console.log('Seed data created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Owner: admin@epr.com / admin123');
    console.log('Franchise: dist@epr.com / dist123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
