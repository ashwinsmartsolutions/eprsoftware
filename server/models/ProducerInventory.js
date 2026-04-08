const mongoose = require('mongoose');

const ownerInventorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Total produced (cumulative)
  totalProduced: {
    orange: { type: Number, default: 0 },
    blueberry: { type: Number, default: 0 },
    jira: { type: Number, default: 0 },
    lemon: { type: Number, default: 0 },
    mint: { type: Number, default: 0 },
    guava: { type: Number, default: 0 }
  },
  // Total allocated to distributors
  totalAllocated: {
    orange: { type: Number, default: 0 },
    blueberry: { type: Number, default: 0 },
    jira: { type: Number, default: 0 },
    lemon: { type: Number, default: 0 },
    mint: { type: Number, default: 0 },
    guava: { type: Number, default: 0 }
  },
  // Available = totalProduced - totalAllocated
  available: {
    orange: { type: Number, default: 0 },
    blueberry: { type: Number, default: 0 },
    jira: { type: Number, default: 0 },
    lemon: { type: Number, default: 0 },
    mint: { type: Number, default: 0 },
    guava: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calculate available before saving
ownerInventorySchema.pre('save', function(next) {
  const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
  flavors.forEach(flavor => {
    this.available[flavor] = this.totalProduced[flavor] - this.totalAllocated[flavor];
    if (this.available[flavor] < 0) this.available[flavor] = 0;
  });
  next();
});

module.exports = mongoose.model('OwnerInventory', ownerInventorySchema);
