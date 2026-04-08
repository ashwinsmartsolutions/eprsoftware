const express = require('express');
const { auth, ownerAuth, franchiseAuth } = require('../middleware/auth');
const { stockAllocationRules, shopStockAllocationRules, mongoIdParamRules } = require('../middleware/validation');
const {
  allocateStockToFranchise,
  allocateStockToShop,
  getFranchiseStock,
  getShopStock,
  getOwnerInventory
} = require('../controllers/stockController');

const router = express.Router();

// Allocate stock to franchise (Owner only)
router.post('/allocate-franchise', auth, ownerAuth, stockAllocationRules, allocateStockToFranchise);

// Allocate stock to shop (Franchise only)
router.post('/allocate-shop', auth, franchiseAuth, shopStockAllocationRules, allocateStockToShop);

// Get franchise stock
router.get('/franchise', auth, getFranchiseStock);

// Get shop stock (Franchise only)
router.get('/shop/:shopId', auth, franchiseAuth, mongoIdParamRules('shopId'), getShopStock);

// Get owner inventory (Owner only)
router.get('/owner-inventory', auth, ownerAuth, getOwnerInventory);

module.exports = router;
