const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['super_admin', 'owner', 'franchise', 'distributor'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    default: null
  },
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
    default: null
  },
  onlineStatus: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  passwordResetRequired: {
    type: Boolean,
    default: false
  },
  impersonationToken: {
    type: String,
    default: null
  },
  impersonationExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('Hashing password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
