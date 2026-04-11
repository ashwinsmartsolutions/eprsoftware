const express = require('express');
const { auth, superAdminAuth } = require('../middleware/auth');
const { mongoIdParamRules } = require('../middleware/validation');

const {
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
} = require('../controllers/adminController');

const router = express.Router();

// Apply auth and superAdminAuth to all routes
router.use(auth, superAdminAuth);

// ==========================================
// Dashboard & System
// ==========================================
router.get('/dashboard', getDashboardStats);
router.get('/system-health', getSystemHealth);

// ==========================================
// User Management
// ==========================================
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', mongoIdParamRules('id'), updateUser);
router.delete('/users/:id', mongoIdParamRules('id'), deleteUser);
router.post('/users/:id/reset-password', mongoIdParamRules('id'), resetUserPassword);
router.post('/users/:id/toggle-status', mongoIdParamRules('id'), toggleUserStatus);
router.post('/users/:id/impersonate', mongoIdParamRules('id'), impersonateUser);
router.post('/impersonate/end', endImpersonation);

// ==========================================
// Franchise Management
// ==========================================
router.get('/franchises', getAllFranchises);
router.post('/franchises/:id/override-stock', mongoIdParamRules('id'), overrideFranchiseStock);
router.get('/franchises/:id/audit', mongoIdParamRules('id'), getFranchiseAudit);

// ==========================================
// Transaction Management
// ==========================================
router.get('/transactions', getAllTransactions);
router.delete('/transactions/:id', mongoIdParamRules('id'), deleteTransaction);

// ==========================================
// Audit Logs
// ==========================================
router.get('/audit-logs', getAuditLogs);

// ==========================================
// System Maintenance
// ==========================================
router.post('/cleanup', cleanupData);
router.post('/export', exportData);

module.exports = router;
