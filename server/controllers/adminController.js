const User = require('../models/User');
const Franchise = require('../models/Franchise');
const Shop = require('../models/Shop');
const Transaction = require('../models/Transaction');
const Production = require('../models/Production');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Helper function to log admin actions
const logAdminAction = async (req, action, details = {}, targetUser = null, targetFranchise = null, targetShop = null, changes = null) => {
  try {
    const log = new AuditLog({
      action,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetUser,
      targetFranchise,
      targetShop,
      details: {
        ...details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      },
      changes,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });
    await log.save();
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Helper to generate temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ==========================================
// Dashboard & Statistics
// ==========================================

// @desc    Get global dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Super Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFranchises,
      totalShops,
      totalTransactions,
      onlineUsers,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Franchise.countDocuments(),
      Shop.countDocuments(),
      Transaction.countDocuments(),
      User.countDocuments({ onlineStatus: 'online' }),
      User.countDocuments({ isActive: true })
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('franchiseId', 'name')
      .populate('shopId', 'name')
      .lean();

    // Stock summary across all franchises
    const franchises = await Franchise.find().lean();
    const totalStock = franchises.reduce((acc, f) => {
      Object.keys(f.stock || {}).forEach(flavor => {
        acc[flavor] = (acc[flavor] || 0) + (f.stock[flavor] || 0);
      });
      return acc;
    }, {});

    // Sales summary
    const salesStats = await Transaction.aggregate([
      { $match: { type: 'sale' } },
      { $group: { _id: null, total: { $sum: '$totalQuantity' } } }
    ]);

    // Recent audit logs
    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('performedBy', 'username email')
      .populate('targetUser', 'username email')
      .lean();

    await logAdminAction(req, 'dashboard_view', { 
      statsRequested: ['users', 'franchises', 'shops', 'transactions'] 
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalFranchises,
        totalShops,
        totalTransactions,
        onlineUsers,
        activeUsers,
        usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
        totalStock,
        totalSales: salesStats[0]?.total || 0
      },
      recentTransactions,
      recentActivity
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system health status
// @route   GET /api/admin/system-health
// @access  Private (Super Admin only)
const getSystemHealth = async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = {};

    for (const col of collections) {
      const stats = await mongoose.connection.db.collection(col.name).stats();
      collectionStats[col.name] = {
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize
      };
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();

    await logAdminAction(req, 'system_health_check');

    res.json({
      success: true,
      health: {
        database: dbStatus,
        collections: collectionStats,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
        },
        uptime: Math.floor(process.uptime()) + ' seconds',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================
// User Management
// ==========================================

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private (Super Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      isActive, 
      search,
      franchiseId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (franchiseId) query.franchiseId = franchiseId;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .populate('franchiseId', 'name email')
      .populate('distributorId', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    await logAdminAction(req, 'user_list_view', { filters: query, page, limit });

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new user (any role)
// @route   POST /api/admin/users
// @access  Private (Super Admin only)
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, franchiseId, distributorId, isActive = true } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Validate franchise assignment for franchise role
    if (role === 'franchise' && !franchiseId) {
      return res.status(400).json({ message: 'Franchise ID is required for franchise role' });
    }

    // Validate franchise exists
    if (franchiseId) {
      const franchise = await Franchise.findById(franchiseId);
      if (!franchise) {
        return res.status(404).json({ message: 'Franchise not found' });
      }
    }

    const user = new User({
      username,
      email,
      password,
      role,
      franchiseId: role === 'franchise' ? franchiseId : null,
      distributorId: role === 'distributor' ? distributorId : null,
      isActive
    });

    await user.save();

    await logAdminAction(req, 'user_create', { 
      username, email, role, franchiseId 
    }, user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user (any field)
// @route   PUT /api/admin/users/:id
// @access  Private (Super Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields directly
    delete updates.password;
    delete updates.impersonationToken;
    delete updates.impersonationExpiry;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store previous state for audit
    const before = {
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      franchiseId: user.franchiseId?.toString()
    };

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();

    const after = {
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      franchiseId: user.franchiseId?.toString()
    };

    await logAdminAction(req, 'user_update', { 
      updatedFields: Object.keys(updates) 
    }, user._id, null, null, { before, after });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        franchiseId: user.franchiseId
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Super Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmPassword } = req.body;

    // Require password confirmation for deletion
    if (!confirmPassword) {
      return res.status(400).json({ message: 'Password confirmation required' });
    }

    const adminUser = await User.findById(req.user._id);
    const isMatch = await adminUser.comparePassword(confirmPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last super admin
    if (user.role === 'super_admin') {
      const superAdminCount = await User.countDocuments({ role: 'super_admin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last super admin' });
      }
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(id);

    await logAdminAction(req, 'user_delete', { 
      deletedUser: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, user._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private (Super Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { tempPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate or use provided temp password
    const newPassword = tempPassword || generateTempPassword();
    
    user.password = newPassword;
    user.passwordResetRequired = true;
    await user.save();

    await logAdminAction(req, 'user_reset_password', {}, user._id);

    res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword: newPassword // Only shown once
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle user active status
// @route   POST /api/admin/users/:id/toggle-status
// @access  Private (Super Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot deactivate yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? 'user_activate' : 'user_deactivate';
    await logAdminAction(req, action, { 
      previousStatus: !user.isActive,
      newStatus: user.isActive 
    }, user._id);

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Impersonate user
// @route   POST /api/admin/users/:id/impersonate
// @access  Private (Super Admin only)
const impersonateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot impersonate super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot impersonate another super admin' });
    }

    // Generate impersonation token
    const impersonationToken = jwt.sign(
      { 
        id: user._id, 
        impersonatedBy: req.user._id,
        type: 'impersonation'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Store in user record
    user.impersonationToken = impersonationToken;
    user.impersonationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    await logAdminAction(req, 'impersonate_start', {
      impersonatedUser: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, user._id);

    res.json({
      success: true,
      message: 'Impersonation token generated',
      token: impersonationToken,
      expiresIn: '30m',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        franchiseId: user.franchiseId
      }
    });
  } catch (error) {
    console.error('Impersonate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    End impersonation
// @route   POST /api/admin/impersonate/end
// @access  Private (Super Admin only, when impersonating)
const endImpersonation = async (req, res) => {
  try {
    const { impersonatedUserId } = req.body;

    const user = await User.findById(impersonatedUserId);
    if (user) {
      user.impersonationToken = null;
      user.impersonationExpiry = null;
      await user.save();
    }

    await logAdminAction(req, 'impersonate_end', {
      impersonatedUser: {
        username: user?.username,
        email: user?.email
      }
    }, user?._id);

    res.json({
      success: true,
      message: 'Impersonation ended'
    });
  } catch (error) {
    console.error('End impersonation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================
// Franchise Management (Override)
// ==========================================

// @desc    Get all franchises with full details
// @route   GET /api/admin/franchises
// @access  Private (Super Admin only)
const getAllFranchises = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const franchises = await Franchise.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get associated users
    const franchiseIds = franchises.map(f => f._id.toString());
    const users = await User.find({ 
      franchiseId: { $in: franchiseIds } 
    }).select('username email franchiseId onlineStatus').lean();

    const franchisesWithUsers = franchises.map(f => ({
      ...f,
      user: users.find(u => u.franchiseId?.toString() === f._id.toString()) || null
    }));

    const total = await Franchise.countDocuments(query);

    res.json({
      success: true,
      franchises: franchisesWithUsers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all franchises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Override franchise stock
// @route   POST /api/admin/franchises/:id/override-stock
// @access  Private (Super Admin only)
const overrideFranchiseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, reason } = req.body;

    const franchise = await Franchise.findById(id);
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    const beforeStock = { ...franchise.stock };

    // Validate and apply stock updates
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    flavors.forEach(flavor => {
      if (stock[flavor] !== undefined) {
        franchise.stock[flavor] = Math.max(0, parseInt(stock[flavor]) || 0);
      }
    });

    await franchise.save();

    await logAdminAction(req, 'stock_override', {
      reason,
      franchiseName: franchise.name,
      changes: flavors.reduce((acc, f) => {
        if (beforeStock[f] !== franchise.stock[f]) {
          acc[f] = { before: beforeStock[f], after: franchise.stock[f] };
        }
        return acc;
      }, {})
    }, null, franchise._id);

    res.json({
      success: true,
      message: 'Stock overridden successfully',
      franchise: {
        id: franchise._id,
        name: franchise.name,
        stock: franchise.stock
      }
    });
  } catch (error) {
    console.error('Override franchise stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get complete franchise audit
// @route   GET /api/admin/franchises/:id/audit
// @access  Private (Super Admin only)
const getFranchiseAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const franchise = await Franchise.findById(id).lean();
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Get all related data
    const [shops, user, transactions, productions, auditLogs] = await Promise.all([
      Shop.find({ franchiseId: id }).lean(),
      User.findOne({ franchiseId: id }).select('-password').lean(),
      Transaction.find({ franchiseId: id }).sort({ createdAt: -1 }).limit(100).lean(),
      Production.find({ franchiseId: id }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ targetFranchise: id }).sort({ createdAt: -1 }).limit(50).populate('performedBy', 'username').lean()
    ]);

    // Calculate statistics
    const totalSales = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.totalQuantity || 0), 0);

    const totalReturns = transactions
      .filter(t => t.type === 'empty_bottle_return')
      .reduce((sum, t) => sum + (t.totalQuantity || 0), 0);

    const totalStockAllocated = transactions
      .filter(t => t.type === 'stock_allocation' && !t.shopId)
      .reduce((sum, t) => sum + (t.totalQuantity || 0), 0);

    await logAdminAction(req, 'franchise_audit_view', { franchiseId: id }, null, franchise._id);

    res.json({
      success: true,
      audit: {
        franchise,
        user,
        shops,
        transactions,
        productions,
        auditLogs,
        stats: {
          totalShops: shops.length,
          totalTransactions: transactions.length,
          totalSales,
          totalReturns,
          totalStockAllocated,
          totalProductions: productions.length
        }
      }
    });
  } catch (error) {
    console.error('Get franchise audit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================
// Transaction Management (Override)
// ==========================================

// @desc    Get all transactions system-wide
// @route   GET /api/admin/transactions
// @access  Private (Super Admin only)
const getAllTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      type, 
      franchiseId, 
      shopId,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (franchiseId) query.franchiseId = franchiseId;
    if (shopId) query.shopId = shopId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('franchiseId', 'name')
      .populate('shopId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Transaction.countDocuments(query);

    // Get summary statistics
    const summary = await Transaction.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: '$type', 
          count: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' }
        } 
      }
    ]);

    res.json({
      success: true,
      transactions,
      summary: summary.reduce((acc, s) => ({ ...acc, [s._id]: s }), {}),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete transaction (admin override)
// @route   DELETE /api/admin/transactions/:id
// @access  Private (Super Admin only)
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, confirmPassword } = req.body;

    // Require password confirmation
    if (!confirmPassword) {
      return res.status(400).json({ message: 'Password confirmation required' });
    }

    const adminUser = await User.findById(req.user._id);
    const isMatch = await adminUser.comparePassword(confirmPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Store transaction data before deletion
    const transactionData = transaction.toObject();

    await Transaction.findByIdAndDelete(id);

    await logAdminAction(req, 'transaction_delete', {
      reason,
      deletedTransaction: {
        type: transactionData.type,
        franchiseId: transactionData.franchiseId,
        shopId: transactionData.shopId,
        totalQuantity: transactionData.totalQuantity,
        createdAt: transactionData.createdAt
      }
    }, null, transactionData.franchiseId, transactionData.shopId);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================
// Audit Logs
// ==========================================

// @desc    Get audit logs with filtering
// @route   GET /api/admin/audit-logs
// @access  Private (Super Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      performedBy, 
      targetUser,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;
    if (targetUser) query.targetUser = targetUser;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'username email role')
      .populate('targetUser', 'username email role')
      .populate('targetFranchise', 'name')
      .populate('targetShop', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    // Get action type counts for summary
    const actionCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      logs,
      summary: {
        actionCounts: actionCounts.reduce((acc, a) => ({ ...acc, [a._id]: a.count }), {}),
        total
      },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==========================================
// System Maintenance
// ==========================================

// @desc    Cleanup old records
// @route   POST /api/admin/cleanup
// @access  Private (Super Admin only)
const cleanupData = async (req, res) => {
  try {
    const { 
      olderThanDays = 90, 
      confirmPassword,
      collections = ['transactions', 'auditLogs']
    } = req.body;

    // Require password confirmation
    if (!confirmPassword) {
      return res.status(400).json({ message: 'Password confirmation required' });
    }

    const adminUser = await User.findById(req.user._id);
    const isMatch = await adminUser.comparePassword(confirmPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const results = {};

    // Cleanup transactions
    if (collections.includes('transactions')) {
      const transactionResult = await Transaction.deleteMany({
        createdAt: { $lt: cutoffDate },
        type: { $in: ['sale', 'empty_bottle_return'] } // Keep allocations
      });
      results.transactions = {
        deleted: transactionResult.deletedCount
      };
    }

    // Cleanup old audit logs
    if (collections.includes('auditLogs')) {
      const auditResult = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      results.auditLogs = {
        deleted: auditResult.deletedCount
      };
    }

    await logAdminAction(req, 'system_cleanup', {
      olderThanDays,
      collections,
      results
    });

    res.json({
      success: true,
      message: 'Cleanup completed',
      results
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export data
// @route   POST /api/admin/export
// @access  Private (Super Admin only)
const exportData = async (req, res) => {
  try {
    const { collection, format = 'json', filters = {} } = req.body;

    let data;
    let filename;

    switch (collection) {
      case 'users':
        data = await User.find(filters).select('-password').lean();
        filename = `users_export_${Date.now()}.json`;
        break;
      case 'franchises':
        data = await Franchise.find(filters).lean();
        filename = `franchises_export_${Date.now()}.json`;
        break;
      case 'transactions':
        data = await Transaction.find(filters).lean();
        filename = `transactions_export_${Date.now()}.json`;
        break;
      case 'auditLogs':
        data = await AuditLog.find(filters).lean();
        filename = `audit_logs_export_${Date.now()}.json`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid collection' });
    }

    await logAdminAction(req, 'data_export', { collection, format, recordCount: data.length });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json({
      success: true,
      filename,
      exportedAt: new Date(),
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Dashboard
  getDashboardStats,
  getSystemHealth,
  
  // User Management
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
  impersonateUser,
  endImpersonation,
  
  // Franchise Management
  getAllFranchises,
  overrideFranchiseStock,
  getFranchiseAudit,
  
  // Transaction Management
  getAllTransactions,
  deleteTransaction,
  
  // Audit Logs
  getAuditLogs,
  
  // System Maintenance
  cleanupData,
  exportData
};
