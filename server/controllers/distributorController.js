const Distributor = require('../models/Distributor');
const User = require('../models/User');

// @desc    Get all distributors
// @route   GET /api/distributors
// @access  Private (Producer only)
const getDistributors = async (req, res) => {
  try {
    // Find all distributors and populate associated user data
    const distributors = await Distributor.find().sort({ createdAt: -1 });
    
    // Get user data for each distributor to include online status
    const distributorsWithStatus = await Promise.all(
      distributors.map(async (distributor) => {
        const user = await User.findOne({ distributorId: distributor._id });
        return {
          ...distributor.toObject(),
          userId: user ? {
            _id: user._id,
            username: user.username,
            onlineStatus: user.onlineStatus,
            lastActive: user.lastActive
          } : null
        };
      })
    );

    res.json({
      success: true,
      count: distributorsWithStatus.length,
      distributors: distributorsWithStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single distributor
// @route   GET /api/distributors/:id
// @access  Private
const getDistributor = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id);
    
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // Check if user is authorized to view this distributor
    if (req.user.role === 'distributor' && req.user.distributorId.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      distributor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update distributor
// @route   PUT /api/distributors/:id
// @access  Private (Producer only)
const updateDistributor = async (req, res) => {
  try {
    const { name, email, phone, address, status } = req.body;
    
    let distributor = await Distributor.findById(req.params.id);
    
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // Update distributor fields
    if (name) distributor.name = name;
    if (email) distributor.email = email;
    if (phone) distributor.phone = phone;
    if (address) distributor.address = address;
    if (status) distributor.status = status;

    await distributor.save();

    // Also update user email if changed
    if (email) {
      await User.findOneAndUpdate(
        { distributorId: distributor._id },
        { email }
      );
    }

    res.json({
      success: true,
      distributor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete distributor
// @route   DELETE /api/distributors/:id
// @access  Private (Producer only)
const deleteDistributor = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id);
    
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // Delete the associated user
    await User.findOneAndDelete({ distributorId: distributor._id });
    
    // Delete the distributor
    await distributor.deleteOne();

    res.json({
      success: true,
      message: 'Distributor deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get distributor analytics
// @route   GET /api/distributors/analytics
// @access  Private (Producer only)
const getDistributorAnalytics = async (req, res) => {
  try {
    const distributors = await Distributor.find();
    
    const analytics = distributors.map(dist => ({
      id: dist._id,
      name: dist.name,
      email: dist.email,
      totalStock: Object.values(dist.stock).reduce((a, b) => a + b, 0),
      totalSold: dist.totalSold,
      totalEmptyBottles: dist.totalEmptyBottles,
      status: dist.status
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
  getDistributors,
  getDistributor,
  updateDistributor,
  deleteDistributor,
  getDistributorAnalytics
};
