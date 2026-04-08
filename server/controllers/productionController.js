const Production = require('../models/Production');
const OwnerInventory = require('../models/ProducerInventory');

// @desc    Record production units
// @route   POST /api/production
// @access  Private (Owner only)
const recordProduction = async (req, res) => {
  try {
    const { stock, notes } = req.body;

    // Save production record
    const production = new Production({
      owner: req.user.id,
      stock,
      notes
    });
    await production.save();

    // Update or create owner inventory
    let inventory = await OwnerInventory.findOne({ owner: req.user.id });
    
    if (!inventory) {
      inventory = new OwnerInventory({
        owner: req.user.id,
        totalProduced: stock,
        totalAllocated: {
          orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0
        }
      });
    } else {
      // Add new production to total produced
      Object.keys(stock).forEach(flavor => {
        inventory.totalProduced[flavor] += stock[flavor] || 0;
      });
    }
    
    await inventory.save();

    res.status(201).json({
      success: true,
      message: 'Production recorded successfully',
      production,
      inventory: {
        totalProduced: inventory.totalProduced,
        totalAllocated: inventory.totalAllocated,
        available: inventory.available
      }
    });
  } catch (error) {
    console.error('Record production error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording production',
      error: error.message
    });
  }
};

// @desc    Get all production records
// @route   GET /api/production
// @access  Private (Owner only)
const getProductionHistory = async (req, res) => {
  try {
    const productions = await Production.find({ owner: req.user.id })
      .sort({ createdAt: -1 });

    // Calculate total production inventory
    const totalInventory = productions.reduce((acc, prod) => {
      Object.keys(prod.stock).forEach(flavor => {
        acc[flavor] = (acc[flavor] || 0) + prod.stock[flavor];
      });
      return acc;
    }, {});

    res.json({
      success: true,
      productions,
      totalInventory
    });
  } catch (error) {
    console.error('Get production error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production history',
      error: error.message
    });
  }
};

// @desc    Get current production inventory (total produced)
// @route   GET /api/production/inventory
// @access  Private (Owner only)
const getProductionInventory = async (req, res) => {
  try {
    // Get or create owner inventory
    let inventory = await OwnerInventory.findOne({ owner: req.user.id });
    
    if (!inventory) {
      inventory = new OwnerInventory({
        owner: req.user.id,
        totalProduced: { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 },
        totalAllocated: { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 }
      });
      await inventory.save();
    }

    const totalProduced = Object.values(inventory.totalProduced).reduce((sum, val) => sum + val, 0);
    const totalAllocated = Object.values(inventory.totalAllocated).reduce((sum, val) => sum + val, 0);
    const totalAvailable = Object.values(inventory.available).reduce((sum, val) => sum + val, 0);

    res.json({
      success: true,
      inventory: inventory.totalProduced,
      allocated: inventory.totalAllocated,
      available: inventory.available,
      totals: {
        produced: totalProduced,
        allocated: totalAllocated,
        available: totalAvailable
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production inventory',
      error: error.message
    });
  }
};

module.exports = {
  recordProduction,
  getProductionHistory,
  getProductionInventory
};
