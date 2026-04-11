const express = require('express');
const { auth, franchiseAuth } = require('../middleware/auth');
const { productionRecordRules } = require('../middleware/validation');
const { recordProduction, getProductionHistory, getProductionInventory } = require('../controllers/productionController');

const router = express.Router();

console.log('[Production Routes] Loaded with franchiseAuth middleware');

// Record production (Franchise only - franchise produces its own stock)
router.post('/', auth, franchiseAuth, productionRecordRules, (req, res, next) => {
  console.log('[Production POST] User role:', req.user?.role, 'FranchiseId:', req.user?.franchiseId);
  next();
}, recordProduction);

// Get production history (Franchise only - view own production)
router.get('/', auth, franchiseAuth, (req, res, next) => {
  console.log('[Production GET] User role:', req.user?.role);
  next();
}, getProductionHistory);

// Get production inventory (Franchise only - view own inventory)
router.get('/inventory', auth, franchiseAuth, (req, res, next) => {
  console.log('[Production GET /inventory] User role:', req.user?.role);
  next();
}, getProductionInventory);

module.exports = router;
