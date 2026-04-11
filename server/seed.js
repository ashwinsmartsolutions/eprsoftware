const mongoose = require('mongoose');
const User = require('./models/User');
const Franchise = require('./models/Franchise');
const Shop = require('./models/Shop');
const Production = require('./models/Production');
const Transaction = require('./models/Transaction');

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
    await Shop.deleteMany({});
    await Production.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data (Users, Franchises, Shops, Productions, Transactions)');

    // Create Owner user - pass plain password, User model will hash it
    const owner = new User({
      username: 'admin',
      email: 'admin@epr.com',
      password: 'admin123',
      role: 'owner'
    });
    await owner.save();
    console.log('Created owner user');

    // Create demo franchise
    const demoFranchise = new Franchise({
      name: 'Demo Franchise',
      email: 'dist@epr.com',
      phone: '1234567890',
      address: '123 Main St, City, State'
    });
    await demoFranchise.save();
    console.log('Created demo franchise');

    // Create franchise user
    const franchiseUser = new User({
      username: 'demo_franchise',
      email: 'dist@epr.com',
      password: 'dist123',
      role: 'franchise',
      franchiseId: demoFranchise._id
    });
    await franchiseUser.save();
    console.log('Created franchise user');

    // Create demo shop for the franchise (zero stock)
    const demoShop = new Shop({
      name: 'Main Store',
      location: 'Downtown',
      area: 'Central Business District',
      contact: '9876543210',
      franchiseId: demoFranchise._id,
      stock: {
        orange: 0,
        blueberry: 0,
        jira: 0,
        lemon: 0,
        mint: 0,
        guava: 0
      },
      totalSold: 0,
      emptyBottlesReturned: 0
    });
    await demoShop.save();
    console.log('Created demo shop (zero stock)');

    // All records cleared - starting fresh with zero values for real-time tracking

    console.log('\n========================================');
    console.log('Seed data created successfully!');
    console.log('========================================');
    console.log('\nLogin Credentials:');
    console.log('Owner: admin@epr.com / admin123');
    console.log('Franchise: dist@epr.com / dist123');
    console.log('\nInitial State (All Values at Zero):');
    console.log('- Total Franchises: 1');
    console.log('- Total Produced: 0 bottles');
    console.log('- Remaining Stock: 0 bottles');
    console.log('- Total Sold: 0 bottles');
    console.log('- Empty Bottles Returned: 0');
    console.log('- Current Shop Stock: 0 bottles');
    console.log('\nAdd production to begin tracking real-time data.');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
