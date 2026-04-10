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

    // Calculate REAL current stock in shops (allocated - sales)
    const currentStock = {};
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    flavors.forEach(flavor => {
      const allocated = allocatedToShopsByFlavor[flavor] || 0;
      const sold = salesByFlavor[flavor] || 0;
      currentStock[flavor] = Math.max(0, allocated - sold);
    });

    console.log(`[FranchiseDetails] Franchise: ${franchise.name}`);
    console.log(`[FranchiseDetails] Shops: ${shops.length}, Sales: ${totalSales}, Returns: ${totalReturns}`);
    console.log(`[FranchiseDetails] Allocated to shops:`, allocatedToShopsByFlavor);
    console.log(`[FranchiseDetails] Sales by flavor:`, salesByFlavor);
    console.log(`[FranchiseDetails] Current stock:`, currentStock);

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
          salesByFlavor,
          returnsByFlavor,
          currentStock: currentStock,
          allocatedToShopsByFlavor: allocatedToShopsByFlavor,
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

module.exports = {
  getFranchises,
  getFranchise,
  getFranchiseDetails,
  updateFranchise,
  deleteFranchise,
  getFranchiseAnalytics
};
