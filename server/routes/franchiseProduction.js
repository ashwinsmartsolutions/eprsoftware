const express = require('express');
const { auth, franchiseAuth } = require('../middleware/auth');
const { productionRecordRules } = require('../middleware/validation');
const { recordProduction, getProductionHistory, getProductionInventory } = require('../controllers/productionController');

const router = express.Router();

console.log('[FranchiseProduction Routes] Loaded - franchise only');

// Request logging middleware
const logRequest = (req, res, next) => {
  console.log(`[FranchiseProduction] ${req.method} ${req.path} - User:`, req.user?.role, 'FranchiseId:', req.user?.franchiseId);
  next();
};

// Record production (Franchise only)
router.post('/record', auth, franchiseAuth, logRequest, productionRecordRules, recordProduction);

// Get production history (Franchise only)
router.get('/history', auth, franchiseAuth, getProductionHistory);

// Get production inventory (Franchise only)
router.get('/inventory', auth, franchiseAuth, getProductionInventory);

module.exports = router;
