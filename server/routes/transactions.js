const express = require('express');
const { auth, ownerAuth, franchiseAuth } = require('../middleware/auth');
const { salesRecordRules, emptyBottleReturnRules, paginationRules, mongoIdParamRules } = require('../middleware/validation');
const {
  recordSales,
  recordEmptyBottles,
  getTransactions,
  getOwnerOverview,
  getFranchiseOverview,
  getShopSales,
  updateStockAllocation
} = require('../controllers/transactionController');

const router = express.Router();

// Record sales (Franchise only)
router.post('/sales', auth, franchiseAuth, salesRecordRules, recordSales);

// Record empty bottle returns (Franchise only)
router.post('/empty-bottles', auth, franchiseAuth, emptyBottleReturnRules, recordEmptyBottles);

// Update stock allocation transaction (Franchise only)
router.put('/:id', auth, franchiseAuth, mongoIdParamRules('id'), updateStockAllocation);

// Get transactions
router.get('/', auth, paginationRules, getTransactions);

// Get owner overview (Owner only)
router.get('/overview', auth, ownerAuth, getOwnerOverview);

// Get franchise overview (Franchise only)
router.get('/franchise-overview', auth, franchiseAuth, getFranchiseOverview);

// Get shop sales (per flavor) - Franchise only
router.get('/shop-sales/:shopId', auth, franchiseAuth, mongoIdParamRules('shopId'), getShopSales);

module.exports = router;
