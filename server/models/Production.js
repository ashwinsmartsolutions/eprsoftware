const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    default: null
  },
  recordedBy: {
    type: String,
    enum: ['owner', 'franchise'],
    default: 'owner'
  },
  date: {
    type: Date,
    default: Date.now
  },
  stock: {
    orange: {
      type: Number,
      default: 0
    },
    blueberry: {
      type: Number,
      default: 0
    },
    jira: {
      type: Number,
      default: 0
    },
    lemon: {
      type: Number,
      default: 0
    },
    mint: {
      type: Number,
      default: 0
    },
    guava: {
      type: Number,
      default: 0
    }
  },
  totalProduced: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate total before saving
productionSchema.pre('save', function(next) {
  this.totalProduced = Object.values(this.stock).reduce((sum, val) => sum + val, 0);
  next();
});

// Add indexes for better query performance
productionSchema.index({ owner: 1, createdAt: -1 });
productionSchema.index({ franchiseId: 1, createdAt: -1 });
productionSchema.index({ date: -1 });

module.exports = mongoose.model('Production', productionSchema);
