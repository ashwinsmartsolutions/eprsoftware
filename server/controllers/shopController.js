const Shop = require('../models/Shop');

// @desc    Create a new shop
// @route   POST /api/shops
// @access  Private (Franchise only)
const createShop = async (req, res) => {
  try {
    const { name, location, area, contact } = req.body;
    const franchiseId = req.user.franchiseId;

    const shop = new Shop({
      name,
      location,
      area,
      contact,
      franchiseId
    });

    await shop.save();

    res.status(201).json({
      success: true,
      shop
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all shops for a franchise
// @route   GET /api/shops
// @access  Private (Franchise only)
const getShops = async (req, res) => {
  try {
    const franchiseId = req.user.franchiseId;
    
    const shops = await Shop.find({ franchiseId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: shops.length,
      shops
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Private (Franchise only)
const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.franchiseId.toString() !== req.user.franchiseId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      shop
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private (Franchise only)
const updateShop = async (req, res) => {
  try {
    const { name, location, area, contact, status } = req.body;

    let shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (shop.franchiseId.toString() !== req.user.franchiseId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update shop fields
    if (name) shop.name = name;
    if (location) shop.location = location;
    if (area) shop.area = area;
    if (contact) shop.contact = contact;
    if (status) shop.status = status;

    await shop.save();

    res.json({
      success: true,
      shop
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private (Franchise only)
const deleteShop = async (req, res) => {
  try {
    console.log('Delete shop request:', req.params.id);
    console.log('User:', req.user);
    console.log('User franchiseId:', req.user.franchiseId);
    
    const shop = await Shop.findById(req.params.id);
    console.log('Found shop:', shop);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user has franchiseId
    if (!req.user.franchiseId) {
      console.log('User has no franchiseId');
      return res.status(403).json({ message: 'Access denied. No franchise assigned.' });
    }

    const shopFranchiseId = shop.franchiseId ? shop.franchiseId.toString() : null;
    const userFranchiseId = req.user.franchiseId.toString();
    
    console.log('Shop franchiseId:', shopFranchiseId);
    console.log('User franchiseId:', userFranchiseId);
    console.log('Match:', shopFranchiseId === userFranchiseId);
    
    if (shopFranchiseId !== userFranchiseId) {
      console.log('Access denied: franchiseId mismatch');
      return res.status(403).json({ 
        message: 'Access denied. You can only delete shops from your own franchise.' 
      });
    }

    await Shop.findByIdAndDelete(req.params.id);
    console.log('Shop deleted successfully');

    res.json({
      success: true,
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createShop,
  getShops,
  getShop,
  updateShop,
  deleteShop
};
