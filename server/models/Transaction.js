const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sale', 'empty_bottle_return', 'stock_allocation'],
    required: true
  },
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null
  },
  items: [{
    flavor: {
      type: String,
      enum: ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  totalQuantity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
transactionSchema.index({ franchiseId: 1, createdAt: -1 });
transactionSchema.index({ shopId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ franchiseId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
