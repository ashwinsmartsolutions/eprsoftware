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
  updateFranchise,
  deleteFranchise,
  getFranchiseAnalytics
};
