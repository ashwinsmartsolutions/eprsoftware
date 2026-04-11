const Production = require('../models/Production');

// @desc    Record production units (Franchise only)
// @route   POST /api/franchise-production/record
// @access  Private (Franchise only)
const recordProduction = async (req, res) => {
  console.log('[recordProduction] Function called');
  try {
    const { stock, notes } = req.body;
    const franchiseId = req.user?.franchiseId;
    
    console.log('[recordProduction] Body:', { stock, notes, franchiseId });
    
    if (!franchiseId) {
      return res.status(400).json({
        success: false,
        message: 'Franchise ID not found'
      });
    }
    
    console.log(`[FranchiseProduction] Recording production:`, {
      userId: req.user.id,
      franchiseId,
      stock
    });

    // Save production record
    const production = new Production({
      owner: req.user.id,
      franchiseId,
      stock,
      notes,
      recordedBy: 'franchise'
    });
    await production.save();
    
    // Update franchise inventory
    const Franchise = require('../models/Franchise');
    let franchise = await Franchise.findById(franchiseId);
    
    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: 'Franchise not found'
      });
    }
    
    // Add production to franchise stock
    Object.keys(stock).forEach(flavor => {
      franchise.stock[flavor] = (franchise.stock[flavor] || 0) + (stock[flavor] || 0);
    });
    
    await franchise.save();
    
    res.status(201).json({
      success: true,
      message: 'Production recorded successfully',
      production,
      franchiseStock: franchise.stock
    });
  } catch (error) {
    console.error('Record production error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording production: ' + error.message,
      error: error.message,
      stack: error.stack
    });
  }
};

// @desc    Get all production records (Franchise only)
// @route   GET /api/franchise-production/history
// @access  Private (Franchise only)
const getProductionHistory = async (req, res) => {
  try {
    const franchiseId = req.user.franchiseId;
    
    if (!franchiseId) {
      return res.status(400).json({
        success: false,
        message: 'Franchise ID not found'
      });
    }
    
    // Get franchise production records
    const productions = await Production.find({ franchiseId })
      .sort({ createdAt: -1 });
    
    // Get franchise stock
    const Franchise = require('../models/Franchise');
    const franchise = await Franchise.findById(franchiseId);
    const inventory = franchise ? franchise.stock : {};

    res.json({
      success: true,
      productions,
      inventory
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

// @desc    Get current production inventory (Franchise only)
// @route   GET /api/franchise-production/inventory
// @access  Private (Franchise only)
const getProductionInventory = async (req, res) => {
  try {
    const franchiseId = req.user.franchiseId;
    
    if (!franchiseId) {
      return res.status(400).json({
        success: false,
        message: 'Franchise ID not found'
      });
    }
    
    const Franchise = require('../models/Franchise');
    const Transaction = require('../models/Transaction');
    
    // Get franchise current stock (remaining)
    const franchise = await Franchise.findById(franchiseId);
    const remainingStock = franchise ? franchise.stock : { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 };
    const remainingTotal = Object.values(remainingStock).reduce((sum, val) => sum + val, 0);
    
    // Calculate total produced from all production records
    const productions = await Production.find({ franchiseId });
    const totalProducedByFlavor = { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 };
    let totalProduced = 0;
    
    productions.forEach(prod => {
      Object.keys(prod.stock || {}).forEach(flavor => {
        const qty = prod.stock[flavor] || 0;
        totalProducedByFlavor[flavor] += qty;
        totalProduced += qty;
      });
    });
    
    // Calculate total distributed (allocated to shops) from transactions
    const allocations = await Transaction.find({ 
      franchiseId, 
      type: 'stock_allocation' 
    });
    
    const distributedByFlavor = { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 };
    let totalDistributed = 0;
    
    allocations.forEach(alloc => {
      (alloc.items || []).forEach(item => {
        const flavor = item.flavor?.toLowerCase();
        const qty = item.quantity || 0;
        if (distributedByFlavor.hasOwnProperty(flavor)) {
          distributedByFlavor[flavor] += qty;
          totalDistributed += qty;
        }
      });
    });

    res.json({
      success: true,
      inventory: remainingStock,
      totalProduced,
      totalProducedByFlavor,
      remainingStock: remainingTotal,
      remainingByFlavor: remainingStock,
      distributedStock: totalDistributed,
      distributedByFlavor
    });
  } catch (error) {
    console.error('Get production inventory error:', error);
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
