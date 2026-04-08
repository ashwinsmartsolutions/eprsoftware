const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
  totalEmptyBottles: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
franchiseSchema.index({ status: 1, createdAt: -1 });
franchiseSchema.index({ email: 1 });

module.exports = mongoose.model('Franchise', franchiseSchema);
