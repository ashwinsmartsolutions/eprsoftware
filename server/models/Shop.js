const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Contact number must be exactly 10 digits'
    }
  },
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
  },
  stock: {
    orange: { type: Number, default: 0 },
    blueberry: { type: Number, default: 0 },
    jira: { type: Number, default: 0 },
    lemon: { type: Number, default: 0 },
    mint: { type: Number, default: 0 },
    guava: { type: Number, default: 0 }
  },
  totalSold: {
    type: Number,
    default: 0
  },
  emptyBottlesReturned: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
shopSchema.index({ franchiseId: 1, status: 1 });
shopSchema.index({ createdAt: -1 });
shopSchema.index({ franchiseId: 1, createdAt: -1 });
shopSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Shop', shopSchema);
