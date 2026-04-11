const Transaction = require('../models/Transaction');
const Franchise = require('../models/Franchise');
const Shop = require('../models/Shop');

// @desc    Record sales from shop
// @route   POST /api/transactions/sales
// @access  Private (Franchise only)
const recordSales = async (req, res) => {
  try {
    const { shopId, items } = req.body;
    const franchiseId = req.user.franchiseId;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('Record Sales - Request Details:', {
      shopId,
      userId,
      userRole,
      franchiseId,
      itemCount: items?.length
    });

    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      console.log('Record Sales - Shop not found:', shopId);
      return res.status(404).json({ message: 'Shop not found' });
    }

    console.log('Record Sales - Shop found:', {
      shopId: shop._id,
      shopName: shop.name,
      shopFranchiseId: shop.franchiseId,
      userFranchiseId: franchiseId
    });

    if (!franchiseId) {
      console.log('Record Sales - User has no franchiseId');
      return res.status(403).json({ message: 'Access denied. User has no franchise assigned.' });
    }

    if (shop.franchiseId.toString() !== franchiseId.toString()) {
      console.error('Record Sales - Franchise ID mismatch:', {
        userFranchiseId: franchiseId,
        shopFranchiseId: shop.franchiseId.toString(),
        shopId: shop._id,
        shopName: shop.name,
        userId: userId,
        userRole: userRole
      });
      return res.status(403).json({ 
        message: `Access denied. Shop belongs to different franchise. User Franchise: ${franchiseId.toString()}, Shop Franchise: ${shop.franchiseId.toString()}` 
      });
    }

    const franchise = await Franchise.findById(franchiseId);
    
    if (!franchise) {
      console.log('Record Sales - Franchise not found:', franchiseId);
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // Check if shop has enough stock and calculate total quantity
    let totalQuantity = 0;
    for (const item of items) {
      const flavor = item.flavor.toLowerCase();
      if (!shop.stock[flavor] || shop.stock[flavor] < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.flavor}. Available: ${shop.stock[flavor] || 0}, Requested: ${item.quantity}` 
        });
      }
      totalQuantity += item.quantity;
    }

    // Build atomic update operations for stock deduction and sales increment
    const shopUpdate = { $inc: { totalSold: totalQuantity } };
    const franchiseUpdate = { $inc: { totalSold: totalQuantity } };
    
    for (const item of items) {
      const flavor = item.flavor.toLowerCase();
      shopUpdate.$inc[`stock.${flavor}`] = -item.quantity;
    }

    // Atomically update shop stock and sales
    const updatedShop = await Shop.findOneAndUpdate(
      { 
        _id: shopId,
        franchiseId: franchiseId
      },
      shopUpdate,
      { new: true }
    );

    if (!updatedShop) {
      return res.status(400).json({ 
        message: 'Failed to update shop stock. Shop may not exist or belong to another franchise.' 
      });
    }

    // Atomically update franchise totals
    await Franchise.findByIdAndUpdate(
      franchiseId,
      franchiseUpdate
    );

    // Create transaction record
    const transaction = new Transaction({
      type: 'sale',
      franchiseId,
      shopId,
      items,
      totalQuantity,
      description: `Sales recorded for shop: ${shop.name}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Sales recorded successfully',
      shop: updatedShop,
      franchise
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record empty bottle returns from shop
// @route   POST /api/transactions/empty-bottles
// @access  Private (Franchise only)
const recordEmptyBottles = async (req, res) => {
  try {
    const { shopId, items } = req.body;
    const franchiseId = req.user.franchiseId;

    const shop = await Shop.findById(shopId);
    const franchise = await Franchise.findById(franchiseId);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.franchiseId.toString() !== franchiseId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate: cannot return more than sold for each flavor
    // Get all sales transactions for this shop
    const salesTransactions = await Transaction.find({
      type: 'sale',
      shopId: shopId
    });

    // Calculate total sold per flavor
    const flavorSales = {};
    salesTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        flavorSales[flavor] = (flavorSales[flavor] || 0) + item.quantity;
      });
    });

    // Get all previous empty bottle returns for this shop
    const returnsTransactions = await Transaction.find({
      type: 'empty_bottle_return',
      shopId: shopId
    });

    // Calculate already returned per flavor
    const flavorReturned = {};
    returnsTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        flavorReturned[flavor] = (flavorReturned[flavor] || 0) + item.quantity;
      });
    });

    // Validate each item
    for (const item of items) {
      const flavor = item.flavor.toLowerCase();
      const sold = flavorSales[flavor] || 0;
      const alreadyReturned = flavorReturned[flavor] || 0;
      const available = Math.max(0, sold - alreadyReturned);
      
      if (item.quantity > available) {
        return res.status(400).json({
          message: `Cannot return more ${item.flavor} bottles than sold. Sold: ${sold}, Already Returned: ${alreadyReturned}, Available: ${available}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate total empty bottles returned
    let totalQuantity = 0;
    for (const item of items) {
      totalQuantity += item.quantity;
    }

    // Atomically update shop empty bottles returned
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { $inc: { emptyBottlesReturned: totalQuantity } },
      { new: true }
    );

    if (!updatedShop) {
      return res.status(400).json({ message: 'Failed to update shop empty bottles count' });
    }

    // Atomically update franchise empty bottles collected
    await Franchise.findByIdAndUpdate(
      franchiseId,
      { $inc: { totalEmptyBottles: totalQuantity } }
    );

    // Create transaction record
    const transaction = new Transaction({
      type: 'empty_bottle_return',
      franchiseId,
      shopId,
      items,
      totalQuantity,
      description: `Empty bottles returned from shop: ${shop.name}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Empty bottles recorded successfully',
      shop: updatedShop,
      franchise
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get transactions for franchise
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    let franchiseId;
    const { page = 1, limit = 10, type, shopId } = req.query;

    if (req.user.role === 'owner') {
      franchiseId = req.query.franchiseId;
    } else {
      franchiseId = req.user.franchiseId;
    }

    const query = { franchiseId };
    if (type) {
      query.type = type;
    }
    
    // Filter by shopId if provided
    if (shopId) {
      query.shopId = shopId;
    }

    const transactions = await Transaction.find(query)
      .populate('shopId', 'name location')
      .populate('franchiseId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get owner overview statistics
// @route   GET /api/transactions/overview
// @access  Private (Owner only)
const getOwnerOverview = async (req, res) => {
  try {
    console.log('=== getOwnerOverview called by user:', req.user?.username, 'role:', req.user?.role);
    
    const franchises = await Franchise.find();
    
    console.log('Found franchises:', franchises.length);
    
    const totalFranchises = franchises.length;
    
    // Calculate total produced from all franchise stock (franchises now handle production)
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    const totalProduced = {};
    flavors.forEach(flavor => {
      totalProduced[flavor] = franchises.reduce((sum, f) => sum + (f.stock?.[flavor] || 0), 0);
    });
    const totalProducedCount = Object.values(totalProduced).reduce((a, b) => a + b, 0);
    console.log('Total produced (from franchises):', totalProducedCount, 'by flavor:', totalProduced);
    
    // Calculate total allocated to franchises (owner -> franchise allocations)
    const allocationTransactions = await Transaction.find({
      shopId: null,
      type: 'stock_allocation'
    }).lean();
    console.log('Found owner allocation transactions:', allocationTransactions.length);
    
    const totalAllocated = {};
    flavors.forEach(flavor => totalAllocated[flavor] = 0);
    
    allocationTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        if (totalAllocated.hasOwnProperty(flavor)) {
          totalAllocated[flavor] += item.quantity;
        }
      });
    });
    const totalAllocatedCount = Object.values(totalAllocated).reduce((a, b) => a + b, 0);
    console.log('Total allocated:', totalAllocatedCount, 'by flavor:', totalAllocated);
    
    // Remaining stock = produced - allocated
    const remainingStock = Math.max(0, totalProducedCount - totalAllocatedCount);
    const remainingByFlavor = {};
    flavors.forEach(flavor => {
      remainingByFlavor[flavor] = Math.max(0, (totalProduced[flavor] || 0) - (totalAllocated[flavor] || 0));
    });
    
    // Calculate TOTAL SOLD from all sale transactions across ALL franchises
    const allSalesTransactions = await Transaction.find({
      type: 'sale'
    }).lean();
    console.log('Found sale transactions:', allSalesTransactions.length);
    
    const totalSold = allSalesTransactions.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
    
    // Calculate sales by flavor
    const salesByFlavor = {};
    flavors.forEach(flavor => salesByFlavor[flavor] = 0);
    
    allSalesTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        if (salesByFlavor.hasOwnProperty(flavor)) {
          salesByFlavor[flavor] += item.quantity;
        }
      });
    });
    console.log('Total sold:', totalSold, 'by flavor:', salesByFlavor);
    
    // Calculate TOTAL EMPTY BOTTLES from all return transactions
    const allReturnTransactions = await Transaction.find({
      type: 'empty_bottle_return'
    }).lean();
    console.log('Found return transactions:', allReturnTransactions.length);
    
    const totalEmptyBottles = allReturnTransactions.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
    
    // Calculate returns by flavor
    const returnsByFlavor = {};
    flavors.forEach(flavor => returnsByFlavor[flavor] = 0);
    
    allReturnTransactions.forEach(t => {
      t.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        if (returnsByFlavor.hasOwnProperty(flavor)) {
          returnsByFlavor[flavor] += item.quantity;
        }
      });
    });
    console.log('Total empty bottles:', totalEmptyBottles, 'by flavor:', returnsByFlavor);

    const response = {
      success: true,
      overview: {
        totalFranchises,
        remainingStock,
        remainingByFlavor,
        totalSold,
        totalEmptyBottles,
        salesByFlavor,
        returnsByFlavor
      }
    };
    
    console.log('=== Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Get owner overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get franchise overview statistics
// @route   GET /api/transactions/franchise-overview
// @access  Private (Franchise only)
const getFranchiseOverview = async (req, res) => {
  try {
    const franchiseId = req.user.franchiseId;
    const franchise = await Franchise.findById(franchiseId);
    const shops = await Shop.find({ franchiseId });

    const totalStock = Object.values(franchise.stock).reduce((a, b) => a + b, 0);
    const totalShops = shops.length;
    const totalSold = franchise.totalSold;
    const totalEmptyBottles = franchise.totalEmptyBottles;

    res.json({
      success: true,
      overview: {
        totalStock,
        totalShops,
        totalSold,
        totalEmptyBottles,
        stock: franchise.stock
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get shop sales statistics (per flavor)
// @route   GET /api/transactions/shop-sales/:shopId
// @access  Private
const getShopSales = async (req, res) => {
  try {
    const { shopId } = req.params;
    let franchiseId;

    if (req.user.role === 'owner') {
      franchiseId = req.query.franchiseId;
    } else {
      franchiseId = req.user.franchiseId;
    }

    // Verify shop belongs to franchise
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.franchiseId.toString() !== franchiseId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all sales transactions for this shop
    const salesTransactions = await Transaction.find({
      type: 'sale',
      shopId: shopId
    });

    // Calculate per-flavor sales
    const flavorSales = {};
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];
    
    flavors.forEach(flavor => {
      flavorSales[flavor] = 0;
    });

    salesTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        if (flavorSales.hasOwnProperty(flavor)) {
          flavorSales[flavor] += item.quantity;
        }
      });
    });

    res.json({
      success: true,
      shopId: shopId,
      shopName: shop.name,
      flavorSales,
      totalSold: Object.values(flavorSales).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Get shop sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update stock allocation transaction
// @route   PUT /api/transactions/:id
// @access  Private (Owner, Franchise)
const updateStockAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const userRole = req.user.role;
    const franchiseId = req.user.franchiseId;

    // Find the existing transaction
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify it's a stock allocation transaction
    if (transaction.type !== 'stock_allocation') {
      return res.status(400).json({ message: 'Can only update stock allocation transactions' });
    }

    // Determine if this is an owner-to-franchise or franchise-to-shop allocation
    const isOwnerAllocation = !transaction.shopId;

    // Authorization checks
    if (userRole === 'owner') {
      // Owner can only update owner-to-franchise allocations
      if (!isOwnerAllocation) {
        return res.status(403).json({ message: 'Owners can only update their allocations to franchises' });
      }
    } else {
      // Franchise can only update their own franchise-to-shop allocations
      if (isOwnerAllocation) {
        return res.status(403).json({ message: 'Franchises cannot update owner allocations' });
      }
      if (transaction.franchiseId.toString() !== franchiseId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const transactionFranchiseId = transaction.franchiseId;
    const franchise = await Franchise.findById(transactionFranchiseId);

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    // For franchise-to-shop allocations, we also need the shop
    let shop = null;
    let shopId = null;
    if (!isOwnerAllocation) {
      shopId = transaction.shopId;
      shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
    }

    // Calculate differences between old and new quantities
    const oldItems = transaction.items || [];
    const newItems = items || [];

    const differences = {};
    let totalDifference = 0;
    let newTotalQuantity = 0;

    // Get all flavor keys
    const flavors = ['orange', 'blueberry', 'jira', 'lemon', 'mint', 'guava'];

    flavors.forEach(flavor => {
      const oldQty = oldItems.find(item => item.flavor.toLowerCase() === flavor)?.quantity || 0;
      const newQty = newItems.find(item => item.flavor.toLowerCase() === flavor)?.quantity || 0;
      const diff = newQty - oldQty;

      if (diff !== 0) {
        differences[flavor] = diff;
      }
      totalDifference += Math.abs(diff);
      newTotalQuantity += newQty;
    });

    // If no changes, return early
    if (Object.keys(differences).length === 0) {
      return res.json({
        success: true,
        message: 'No changes made',
        transaction
      });
    }

    // For owner allocations: validate against owner inventory
    // For franchise allocations: validate against franchise stock and shop stock
    if (isOwnerAllocation) {
      // Owner allocation update - need to check owner inventory via stock controller logic
      // Get current owner inventory
      const Production = require('../models/Production');
      const productions = await Production.find();
      
      const totalProduced = {};
      const totalAllocated = {};
      flavors.forEach(flavor => {
        totalProduced[flavor] = productions.reduce((sum, p) => sum + (p.quantity[flavor] || 0), 0);
        totalAllocated[flavor] = 0;
      });

      // Calculate total allocated to all franchises (excluding current transaction's franchise)
      const allAllocations = await Transaction.find({ 
        type: 'stock_allocation', 
        shopId: null,
        _id: { $ne: id }
      });
      
      allAllocations.forEach(alloc => {
        alloc.items.forEach(item => {
          const flavor = item.flavor.toLowerCase();
          if (totalAllocated.hasOwnProperty(flavor)) {
            totalAllocated[flavor] += item.quantity;
          }
        });
      });

      // Check if owner has enough inventory for increased allocations
      for (const [flavor, diff] of Object.entries(differences)) {
        if (diff > 0) {
          // Trying to allocate more - check if owner has enough available
          const available = (totalProduced[flavor] || 0) - (totalAllocated[flavor] || 0);
          if (available < diff) {
            return res.status(400).json({
              message: `Insufficient owner inventory for ${flavor}. Available: ${available}, Additional needed: ${diff}`
            });
          }
        } else if (diff < 0) {
          // Trying to reduce allocation - check if franchise has enough to return
          const franchiseStockAvailable = franchise.stock[flavor] || 0;
          const amountToReturn = Math.abs(diff);
          if (franchiseStockAvailable < amountToReturn) {
            return res.status(400).json({
              message: `Franchise doesn't have enough ${flavor} stock to reduce. Franchise has: ${franchiseStockAvailable}, Trying to remove: ${amountToReturn}`
            });
          }
        }
      }

      // Build update operations for owner allocation
      const franchiseUpdate = { $inc: {} };

      Object.entries(differences).forEach(([flavor, diff]) => {
        // If diff > 0, franchise receives more (add)
        // If diff < 0, franchise gives back (subtract)
        franchiseUpdate.$inc[`stock.${flavor}`] = diff;
      });

      // Update franchise stock
      const updatedFranchise = await Franchise.findByIdAndUpdate(
        transactionFranchiseId,
        franchiseUpdate,
        { new: true }
      );

      if (!updatedFranchise) {
        return res.status(400).json({ message: 'Failed to update franchise stock' });
      }

      // Update OwnerInventory totalAllocated (fetch, modify, save to trigger hook)
      const OwnerInventory = require('../models/ProducerInventory');
      const ownerInventory = await OwnerInventory.findOne({ owner: req.user.id });
      if (ownerInventory) {
        Object.entries(differences).forEach(([flavor, diff]) => {
          // diff > 0 means allocating more (increase totalAllocated)
          // diff < 0 means reducing allocation (decrease totalAllocated)
          ownerInventory.totalAllocated[flavor] = (ownerInventory.totalAllocated[flavor] || 0) + diff;
          if (ownerInventory.totalAllocated[flavor] < 0) ownerInventory.totalAllocated[flavor] = 0;
        });
        await ownerInventory.save(); // Triggers pre-save hook to recalculate available
      }

      // Update the transaction
      transaction.items = newItems;
      transaction.totalQuantity = newTotalQuantity;
      await transaction.save();

      res.json({
        success: true,
        message: 'Stock allocation updated successfully',
        transaction,
        franchise: updatedFranchise
      });
    } else {
      // Franchise-to-shop allocation update
      // Check if franchise has enough stock for increased allocations
      for (const [flavor, diff] of Object.entries(differences)) {
        if (diff > 0) {
          // Trying to allocate more - check if franchise has enough
          const availableFranchiseStock = franchise.stock[flavor] || 0;
          if (availableFranchiseStock < diff) {
            return res.status(400).json({
              message: `Insufficient franchise stock for ${flavor}. Available: ${availableFranchiseStock}, Additional needed: ${diff}`
            });
          }
        } else if (diff < 0) {
          // Trying to reduce allocation - check if shop has enough to return
          const shopStockAvailable = shop.stock[flavor] || 0;
          const amountToReturn = Math.abs(diff);
          if (shopStockAvailable < amountToReturn) {
            return res.status(400).json({
              message: `Shop doesn't have enough ${flavor} stock to reduce. Shop has: ${shopStockAvailable}, Trying to remove: ${amountToReturn}`
            });
          }
        }
      }

      // Build update operations
      const franchiseUpdate = { $inc: {} };
      const shopUpdate = { $inc: {} };

      Object.entries(differences).forEach(([flavor, diff]) => {
        // If diff > 0, franchise gives more (subtract), shop receives more (add)
        // If diff < 0, franchise gets back (add), shop gives back (subtract)
        franchiseUpdate.$inc[`stock.${flavor}`] = -diff;
        shopUpdate.$inc[`stock.${flavor}`] = diff;
      });

      // Update franchise stock
      const updatedFranchise = await Franchise.findByIdAndUpdate(
        transactionFranchiseId,
        franchiseUpdate,
        { new: true }
      );

      if (!updatedFranchise) {
        return res.status(400).json({ message: 'Failed to update franchise stock' });
      }

      // Update shop stock
      const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        shopUpdate,
        { new: true }
      );

      if (!updatedShop) {
        return res.status(400).json({ message: 'Failed to update shop stock' });
      }

      // Update the transaction
      transaction.items = newItems;
      transaction.totalQuantity = newTotalQuantity;
      await transaction.save();

      res.json({
        success: true,
        message: 'Stock allocation updated successfully',
        transaction,
        franchise: updatedFranchise,
        shop: updatedShop
      });
    }
  } catch (error) {
    console.error('Update stock allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  recordSales,
  recordEmptyBottles,
  getTransactions,
  getOwnerOverview,
  getFranchiseOverview,
  getShopSales,
  updateStockAllocation
};
