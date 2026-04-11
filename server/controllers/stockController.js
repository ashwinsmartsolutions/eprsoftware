const Franchise = require('../models/Franchise');
const Shop = require('../models/Shop');
const Transaction = require('../models/Transaction');
const OwnerInventory = require('../models/ProducerInventory');

// @desc    Allocate stock to franchise (Owner only)
// @route   POST /api/stock/allocate-franchise
// @access  Private (Owner only)
const allocateStockToFranchise = async (req, res) => {
  try {
    const { franchiseId, stock } = req.body;

    // Get owner inventory and check available stock
    let ownerInventory = await OwnerInventory.findOne({ owner: req.user.id });
    
    if (!ownerInventory) {
      return res.status(400).json({ 
        success: false,
        message: 'No production inventory found. Please record production first.' 
      });
    }

    // Calculate real-time available for each flavor (produced - allocated)
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    const available = {};
    flavors.forEach(flavor => {
      const produced = ownerInventory.totalProduced[flavor] || 0;
      const allocated = ownerInventory.totalAllocated[flavor] || 0;
      available[flavor] = Math.max(0, produced - allocated);
    });

    // Check if owner has enough available stock for each flavor
    for (const [flavor, quantity] of Object.entries(stock)) {
      if (quantity > 0) {
        const flavorAvailable = available[flavor] || 0;
        if (flavorAvailable < quantity) {
          return res.status(400).json({ 
            success: false,
            message: `Insufficient stock for ${flavor}. Available: ${flavorAvailable}, Requested: ${quantity}` 
          });
        }
      }
    }

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Build atomic update operations for franchise stock
    const franchiseUpdate = { $inc: {} };
    const ownerInventoryUpdate = { $inc: {} };
    
    Object.keys(stock).forEach(flavor => {
      if (stock[flavor] > 0) {
        franchiseUpdate.$inc[`stock.${flavor}`] = stock[flavor];
        ownerInventoryUpdate.$inc[`totalAllocated.${flavor}`] = stock[flavor];
      }
    });

    // Atomically update franchise stock
    const updatedFranchise = await Franchise.findByIdAndUpdate(
      franchiseId,
      franchiseUpdate,
      { new: true }
    );

    if (!updatedFranchise) {
      return res.status(404).json({ message: 'Franchise not found or update failed' });
    }

    // Update owner inventory - fetch, modify, save to trigger pre-save hook
    const ownerInventoryDoc = await OwnerInventory.findOne({ owner: req.user.id });
    if (ownerInventoryDoc) {
      Object.keys(stock).forEach(flavor => {
        if (stock[flavor] > 0) {
          ownerInventoryDoc.totalAllocated[flavor] = (ownerInventoryDoc.totalAllocated[flavor] || 0) + stock[flavor];
        }
      });
      await ownerInventoryDoc.save(); // This triggers the pre-save hook to recalculate available
    }

    // Create transaction record
    const items = Object.entries(stock)
      .filter(([_, quantity]) => quantity > 0)
      .map(([flavor, quantity]) => ({ flavor, quantity }));

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const transaction = new Transaction({
      type: 'stock_allocation',
      franchiseId,
      items,
      totalQuantity,
      description: `Stock allocated to ${franchise.name}`
    });

    await transaction.save();

    // Reload to get updated values and recalculate available
    const updatedInventory = await OwnerInventory.findOne({ owner: req.user.id });
    
    // Recalculate available per-flavor for accurate response
    const updatedAvailable = {};
    if (updatedInventory) {
      flavors.forEach(flavor => {
        const produced = updatedInventory.totalProduced[flavor] || 0;
        const allocated = updatedInventory.totalAllocated[flavor] || 0;
        updatedAvailable[flavor] = Math.max(0, produced - allocated);
      });
    }

    res.json({
      success: true,
      message: 'Stock allocated successfully',
      franchise,
      availableStock: updatedAvailable
    });
  } catch (error) {
    console.error('Stock allocation error:', error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Allocate stock to shop (Franchise only)
// @route   POST /api/stock/allocate-shop
// @access  Private (Franchise only)
const allocateStockToShop = async (req, res) => {
  try {
    const { shopId, stock } = req.body;
    const franchiseId = req.user.franchiseId;

    const franchise = await Franchise.findById(franchiseId);
    const shop = await Shop.findById(shopId);

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.franchiseId.toString() !== franchiseId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if franchise has enough stock
    for (const [flavor, quantity] of Object.entries(stock)) {
      const flavorKey = flavor.toLowerCase();
      if (quantity > 0 && franchise.stock[flavorKey] < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${flavor}. Available: ${franchise.stock[flavorKey]}, Requested: ${quantity}` 
        });
      }
    }

    // Build atomic update operations
    const franchiseUpdate = { $inc: {} };
    const shopUpdate = { $inc: {} };
    let totalQuantity = 0;

    Object.keys(stock).forEach(flavor => {
      const flavorKey = flavor.toLowerCase();
      if (stock[flavor] > 0) {
        franchiseUpdate.$inc[`stock.${flavorKey}`] = -stock[flavor];
        shopUpdate.$inc[`stock.${flavorKey}`] = stock[flavor];
        totalQuantity += stock[flavor];
      }
    });

    // Atomically update franchise stock (deduct)
    const updatedFranchise = await Franchise.findByIdAndUpdate(
      franchiseId,
      franchiseUpdate,
      { new: true }
    );

    if (!updatedFranchise) {
      return res.status(400).json({ 
        message: 'Stock update failed. Insufficient stock or franchise not found.' 
      });
    }

    // Atomically update shop stock (add)
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      shopUpdate,
      { new: true }
    );

    // Create transaction record
    const items = Object.entries(stock)
      .filter(([_, quantity]) => quantity > 0)
      .map(([flavor, quantity]) => ({ flavor, quantity }));

    const transaction = new Transaction({
      type: 'stock_allocation',
      franchiseId,
      shopId,
      items,
      totalQuantity,
      description: `Stock allocated to shop: ${shop.name}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Stock allocated to shop successfully',
      franchise: updatedFranchise,
      shop: updatedShop
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get franchise stock
// @route   GET /api/stock/franchise
// @access  Private
const getFranchiseStock = async (req, res) => {
  try {
    let franchiseId;

    if (req.user.role === 'owner') {
      franchiseId = req.query.franchiseId;
    } else {
      franchiseId = req.user.franchiseId;
    }

    const franchise = await Franchise.findById(franchiseId);
    
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    res.json({
      success: true,
      stock: franchise.stock,
      totalStock: Object.values(franchise.stock).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get shop stock
// @route   GET /api/stock/shop/:shopId
// @access  Private (Franchise only)
const getShopStock = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.franchiseId.toString() !== req.user.franchiseId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      stock: shop.stock,
      totalStock: Object.values(shop.stock).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get owner available stock (now aggregates all franchise production)
// @route   GET /api/stock/owner-inventory
// @access  Private (Owner only)
const getOwnerInventory = async (req, res) => {
  try {
    // Get all franchises' stock
    const franchises = await Franchise.find();
    
    // Aggregate production from all franchises
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    const totalProduced = {};
    const totalAllocated = {};
    const available = {};
    
    flavors.forEach(flavor => {
      totalProduced[flavor] = franchises.reduce((sum, f) => sum + (f.stock?.[flavor] || 0), 0);
      totalAllocated[flavor] = 0; // Will track later if needed
      available[flavor] = totalProduced[flavor];
    });

    res.json({
      success: true,
      totalProduced,
      totalAllocated,
      available,
      totalAvailable: Object.values(available).reduce((sum, val) => sum + val, 0),
      franchiseCount: franchises.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  allocateStockToFranchise,
  allocateStockToShop,
  getFranchiseStock,
  getShopStock,
  getOwnerInventory
};
