const mongoose = require('mongoose');
const User = require('./models/User');
const Franchise = require('./models/Franchise');

require('dotenv').config();

const verifyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log('Connected to MongoDB Atlas\n');

    // Check all users
    const users = await User.find().select('-password');
    console.log('=== Users in Database ===');
    users.forEach(u => {
      console.log(`- ${u.username} (${u.email})`);
      console.log(`  Role: ${u.role}`);
      console.log(`  FranchiseId: ${u.franchiseId}`);
      console.log(`  Online: ${u.onlineStatus}`);
      console.log('');
    });

    // Check all franchises
    const franchises = await Franchise.find();
    console.log('=== Franchises in Database ===');
    franchises.forEach(f => {
      console.log(`- ${f.name} (${f.email})`);
      console.log(`  ID: ${f._id}`);
      console.log(`  Status: ${f.status}`);
      console.log('');
    });

    // Test login for franchise
    console.log('=== Testing Franchise Login ===');
    const franchiseUser = await User.findOne({ email: 'dist@epr.com' }).select('+password');
    if (franchiseUser) {
      console.log('Found franchise user:', franchiseUser.username);
      console.log('Role:', franchiseUser.role);
      
      // Test password comparison
      const testPassword = 'dist123';
      const isMatch = await franchiseUser.comparePassword(testPassword);
      console.log('Password match for "dist123":', isMatch);
      
      if (!isMatch) {
        console.log('\n⚠️  WARNING: Password does not match!');
        console.log('The password may have been hashed incorrectly.');
      }
    } else {
      console.log('❌ Franchise user not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyData();
