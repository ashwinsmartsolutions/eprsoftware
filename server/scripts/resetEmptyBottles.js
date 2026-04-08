const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');
const Franchise = require('../models/Franchise');
const Transaction = require('../models/Transaction');

dotenv.config();

const resetEmptyBottles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');

    // Reset all shops' emptyBottlesReturned to 0
    const shopResult = await Shop.updateMany(
      {},
      { $set: { emptyBottlesReturned: 0 } }
    );
    console.log(`Reset emptyBottlesReturned for ${shopResult.modifiedCount} shops`);

    // Reset all franchises' totalEmptyBottles to 0
    const franchiseResult = await Franchise.updateMany(
      {},
      { $set: { totalEmptyBottles: 0 } }
    );
    console.log(`Reset totalEmptyBottles for ${franchiseResult.modifiedCount} franchises`);

    // Delete all empty_bottle_return transactions
    const transactionResult = await Transaction.deleteMany({
      type: 'empty_bottle_return'
    });
    console.log(`Deleted ${transactionResult.deletedCount} empty bottle return transactions`);

    console.log('\n✅ Empty bottles data reset complete!');
    console.log('You can now re-enter the correct empty bottle returns.');

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting empty bottles:', error);
    process.exit(1);
  }
};

resetEmptyBottles();
