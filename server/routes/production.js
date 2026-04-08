const express = require('express');
const { auth, ownerAuth } = require('../middleware/auth');
const { productionRecordRules } = require('../middleware/validation');
const { recordProduction, getProductionHistory, getProductionInventory } = require('../controllers/productionController');

const router = express.Router();

// Record production (Owner only)
router.post('/', auth, ownerAuth, productionRecordRules, recordProduction);

// Get production history (Owner only)
router.get('/', auth, ownerAuth, getProductionHistory);

// Get production inventory (Owner only)
router.get('/inventory', auth, ownerAuth, getProductionInventory);

module.exports = router;
