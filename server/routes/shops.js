const express = require('express');
const { auth, franchiseAuth } = require('../middleware/auth');
const { shopCreateRules, shopUpdateRules, mongoIdParamRules } = require('../middleware/validation');
const {
  createShop,
  getShops,
  getShop,
  updateShop,
  deleteShop
} = require('../controllers/shopController');

const router = express.Router();

// All routes require franchise authentication
router.use(auth, franchiseAuth);

// Create shop
router.post('/', shopCreateRules, createShop);

// Get all shops for the franchise
router.get('/', getShops);

// Get single shop
router.get('/:id', mongoIdParamRules('id'), getShop);

// Update shop
router.put('/:id', mongoIdParamRules('id'), shopUpdateRules, updateShop);

// Delete shop
router.delete('/:id', mongoIdParamRules('id'), deleteShop);

module.exports = router;
