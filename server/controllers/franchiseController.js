const Franchise = require('../models/Franchise');
const User = require('../models/User');

// @desc    Get all franchises
// @route   GET /api/franchises
// @access  Private (Owner only)
const getFranchises = async (req, res) => {
  try {
    // Find all franchises sorted by creation date
    const franchises = await Franchise.find().sort({ createdAt: -1 }).lean();
    
    // Get all franchise IDs
    const franchiseIds = franchises.map(f => f._id.toString());
    
    // Fetch all associated users in a single query (fixes N+1 problem)
    const users = await User.find({ 
      franchiseId: { $in: franchiseIds } 
    }).select('_id franchiseId username onlineStatus lastActive').lean();
    
    // Create a map for O(1) lookup
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.franchiseId.toString(), {
        _id: user._id,
        username: user.username,
        onlineStatus: user.onlineStatus,
        lastActive: user.lastActive
      });
    });
    
    // Merge franchise data with user data
    const franchisesWithStatus = franchises.map(franchise => ({
      ...franchise,
      userId: userMap.get(franchise._id.toString()) || null
    }));

    res.json({
      success: true,
      count: franchisesWithStatus.length,
      franchises: franchisesWithStatus
    });
  } catch (error) {
    console.error('Get franchises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single franchise
// @route   GET /api/franchises/:id
// @access  Private
const getFranchise = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Check if user is authorized to view this franchise
    if (req.user.role === 'franchise' && req.user.franchiseId.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      franchise
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get franchise details with shops, stock, sales and returns
// @route   GET /api/franchises/:id/details
// @access  Private (Owner only)
const getFranchiseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get franchise
    const franchise = await Franchise.findById(id).lean();
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Get associated user
    const user = await User.findOne({ franchiseId: id }).lean();

    // Get all shops for this franchise
    const Shop = require('../models/Shop');
    const shops = await Shop.find({ franchiseId: id }).lean();

    // Get all transactions for this franchise's shops
    const Transaction = require('../models/Transaction');
    const shopIds = shops.map(s => s._id.toString());
    
    const salesTransactions = await Transaction.find({
      shopId: { $in: shopIds },
      type: 'sale'
    }).sort({ createdAt: -1 }).lean();

    const returnTransactions = await Transaction.find({
      shopId: { $in: shopIds },
      type: 'empty_bottle_return'
    }).sort({ createdAt: -1 }).lean();

    // Get stock allocation transactions from franchise to shops
    const allocationTransactions = await Transaction.find({
      shopId: { $in: shopIds },
      type: 'stock_allocation'
    }).lean();

    // Calculate totals
    const totalSales = salesTransactions.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
    const totalReturns = returnTransactions.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
    const totalShops = shops.length;

    // Calculate stock allocated FROM owner TO this franchise (historical)
    const ownerAllocationTransactions = await Transaction.find({
      franchiseId: id,
      shopId: null,
      type: 'stock_allocation'
    }).lean();
    
    const totalStockAllocatedByOwner = {};
    ownerAllocationTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        totalStockAllocatedByOwner[flavor] = (totalStockAllocatedByOwner[flavor] || 0) + item.quantity;
      });
    });
    const totalStockAllocated = Object.values(totalStockAllocatedByOwner).reduce((sum, val) => sum + val, 0);

    // Calculate total sold by flavor
    const salesByFlavor = {};
    salesTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        salesByFlavor[flavor] = (salesByFlavor[flavor] || 0) + item.quantity;
      });
    });

    // Calculate returns by flavor
    const returnsByFlavor = {};
    returnTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        returnsByFlavor[flavor] = (returnsByFlavor[flavor] || 0) + item.quantity;
      });
    });

    // Calculate stock allocated to shops by flavor
    const allocatedToShopsByFlavor = {};
    allocationTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        allocatedToShopsByFlavor[flavor] = (allocatedToShopsByFlavor[flavor] || 0) + item.quantity;
      });
    });

    // Get franchise production records
    const Production = require('../models/Production');
    const productionRecords = await Production.find({ franchiseId: id }).lean();
    
    // Calculate total produced by franchise by flavor
    const producedByFranchise = {};
    productionRecords.forEach(prod => {
      Object.keys(prod.stock || {}).forEach(flavor => {
        const qty = prod.stock[flavor] || 0;
        producedByFranchise[flavor] = (producedByFranchise[flavor] || 0) + qty;
      });
    });
    const totalProducedByFranchise = Object.values(producedByFranchise).reduce((sum, val) => sum + val, 0);

    // Calculate REAL current stock at FRANCHISE level
    // Formula: (Owner Allocations + Franchise Production) - Allocated to Shops
    const currentStock = {};
    const totalReceived = {};
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    
    flavors.forEach(flavor => {
      const allocatedByOwner = totalStockAllocatedByOwner[flavor] || 0;
      const producedByFranchiseFlavor = producedByFranchise[flavor] || 0;
      const allocatedToShops = allocatedToShopsByFlavor[flavor] || 0;
      
      // Total received by franchise (from owner + self production)
      totalReceived[flavor] = allocatedByOwner + producedByFranchiseFlavor;
      
      // Remaining stock at franchise
      currentStock[flavor] = Math.max(0, totalReceived[flavor] - allocatedToShops);
    });
    
    const totalCurrentStock = Object.values(currentStock).reduce((sum, val) => sum + val, 0);
    const totalReceivedAll = Object.values(totalReceived).reduce((sum, val) => sum + val, 0);

    console.log(`[FranchiseDetails] Franchise: ${franchise.name}`);
    console.log(`[FranchiseDetails] Shops: ${shops.length}, Sales: ${totalSales}, Returns: ${totalReturns}`);
    console.log(`[FranchiseDetails] Owner allocated:`, totalStockAllocatedByOwner);
    console.log(`[FranchiseDetails] Franchise produced:`, producedByFranchise);
    console.log(`[FranchiseDetails] Total received:`, totalReceived);
    console.log(`[FranchiseDetails] Allocated to shops:`, allocatedToShopsByFlavor);
    console.log(`[FranchiseDetails] Current stock at franchise:`, currentStock);
    console.log(`[FranchiseDetails] Total current stock:`, totalCurrentStock);

    res.json({
      success: true,
      details: {
        franchise,
        user: user ? {
          _id: user._id,
          username: user.username,
          email: user.email,
          onlineStatus: user.onlineStatus,
          lastActive: user.lastActive
        } : null,
        shops,
        stats: {
          totalShops,
          totalSales,
          totalReturns,
          totalStockAllocated,
          totalProducedByFranchise,
          totalCurrentStock,
          totalReceivedAll,
          salesByFlavor,
          returnsByFlavor,
          currentStock: currentStock,
          allocatedToShopsByFlavor: allocatedToShopsByFlavor,
          producedByFranchise: producedByFranchise,
          totalReceivedByFlavor: totalReceived,
          franchiseStock: franchise.stock || {}
        },
        recentSales: salesTransactions.slice(0, 10),
        recentReturns: returnTransactions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error getting franchise details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update franchise
// @route   PUT /api/franchises/:id
// @access  Private (Owner only)
const updateFranchise = async (req, res) => {
  try {
    const { name, email, phone, address, status } = req.body;
    
    let franchise = await Franchise.findById(req.params.id);
    
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Update franchise fields
    if (name) franchise.name = name;
    if (email) franchise.email = email;
    if (phone) franchise.phone = phone;
    if (address) franchise.address = address;
    if (status) franchise.status = status;

    await franchise.save();

    // Also update user email if changed
    if (email) {
      await User.findOneAndUpdate(
        { franchiseId: franchise._id },
        { email }
      );
    }

    res.json({
      success: true,
      franchise
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete franchise
// @route   DELETE /api/franchises/:id
// @access  Private (Owner only)
const deleteFranchise = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Delete the associated user
    await User.findOneAndDelete({ franchiseId: franchise._id });
    
    // Delete the franchise
    await franchise.deleteOne();

    res.json({
      success: true,
      message: 'Franchise deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get franchise analytics
// @route   GET /api/franchises/analytics
// @access  Private (Owner only)
const getFranchiseAnalytics = async (req, res) => {
  try {
    const franchises = await Franchise.find();
    
    const analytics = franchises.map(fr => ({
      id: fr._id,
      name: fr.name,
      email: fr.email,
      totalStock: Object.values(fr.stock).reduce((a, b) => a + b, 0),
      totalSold: fr.totalSold,
      totalEmptyBottles: fr.totalEmptyBottles,
      status: fr.status
    }));

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get franchise allocation history
// @route   GET /api/franchises/:id/allocations
// @access  Private (Franchise owner or Owner)
const getFranchiseAllocations = async (req, res) => {
  try {
    const { id } = req.params;
    const Transaction = require('../models/Transaction');
    
    // Get all allocation transactions for this franchise
    const allocations = await Transaction.find({
      franchiseId: id,
      type: 'stock_allocation',
      shopId: null // Only owner-to-franchise allocations
    }).sort({ createdAt: -1 }).lean();
    
    res.json({
      success: true,
      allocations
    });
  } catch (error) {
    console.error('Get franchise allocations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get franchise production data (Owner only)
// @route   GET /api/franchises/:id/production
// @access  Private (Owner only)
const getFranchiseProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const Production = require('../models/Production');
    const Transaction = require('../models/Transaction');
    
    // Verify franchise exists
    const franchise = await Franchise.findById(id).lean();
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }
    
    // Get all production records for this franchise
    const productions = await Production.find({ franchiseId: id })
      .sort({ createdAt: -1 })
      .lean();
    
    // Calculate total produced by flavor
    const totalProducedByFlavor = { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 };
    let totalProduced = 0;
    
    productions.forEach(prod => {
      Object.keys(prod.stock || {}).forEach(flavor => {
        const qty = prod.stock[flavor] || 0;
        totalProducedByFlavor[flavor] += qty;
        totalProduced += qty;
      });
    });
    
    // Calculate distributed (allocated to shops)
    const Shop = require('../models/Shop');
    const shops = await Shop.find({ franchiseId: id }).lean();
    const shopIds = shops.map(s => s._id.toString());
    
    const allocations = await Transaction.find({
      shopId: { $in: shopIds },
      type: 'stock_allocation'
    }).lean();
    
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
    
    // Calculate remaining stock at franchise
    const remainingByFlavor = {};
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    flavors.forEach(flavor => {
      remainingByFlavor[flavor] = Math.max(0, (totalProducedByFlavor[flavor] || 0) - (distributedByFlavor[flavor] || 0));
    });
    const totalRemaining = Object.values(remainingByFlavor).reduce((sum, val) => sum + val, 0);
    
    console.log(`[FranchiseProduction] Franchise: ${franchise.name}`);
    console.log(`[FranchiseProduction] Total Produced:`, totalProducedByFlavor);
    console.log(`[FranchiseProduction] Remaining Stock:`, remainingByFlavor);
    
    res.json({
      success: true,
      production: {
        totalProduced,
        totalProducedByFlavor,
        totalDistributed,
        distributedByFlavor,
        totalRemaining,
        remainingByFlavor,
        productionCount: productions.length,
        recentProductions: productions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get franchise production error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFranchises,
  getFranchise,
  getFranchiseDetails,
  updateFranchise,
  deleteFranchise,
  getFranchiseAnalytics,
  getFranchiseAllocations,
  getFranchiseProduction
};
