const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_create', 'user_update', 'user_delete', 'user_reset_password',
      'franchise_create', 'franchise_update', 'franchise_delete', 'franchise_transfer',
      'shop_create', 'shop_update', 'shop_delete',
      'stock_override', 'transaction_override', 'transaction_delete',
      'system_cleanup', 'system_backup', 'system_seed',
      'impersonate_start', 'impersonate_end',
      'login', 'logout', 'password_change',
      'config_update', 'product_add', 'product_update'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByRole: {
    type: String,
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  targetFranchise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    default: null
  },
  targetShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });
auditLogSchema.index({ targetFranchise: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
