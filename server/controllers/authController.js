const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Franchise = require('../models/Franchise');

// Generate JWT Token - 2 hours expiration
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });
};

// @desc    Register franchise (Owner only can create franchises)
// @route   POST /api/auth/register
// @access  Private (Owner only)
const registerFranchise = async (req, res) => {
  try {
    const { username, email, password, franchiseName, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create franchise first
    const franchise = new Franchise({
      name: franchiseName,
      email,
      phone,
      address
    });

    await franchise.save();

    // Create user with franchise role
    const user = new User({
      username,
      email,
      password,
      role: 'franchise',
      franchiseId: franchise._id
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      expiresIn: '2h',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        franchiseId: user.franchiseId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordReceived: !!password });

    // Validate input
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log('Login - User found:', !!user);
    
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Login - User details:', { 
      userId: user._id, 
      role: user.role, 
      hasPassword: !!user.password 
    });

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('Login - Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update user status to online
    user.onlineStatus = 'online';
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      expiresIn: '2h',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        franchiseId: user.franchiseId,
        onlineStatus: user.onlineStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Logout user / Clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.onlineStatus = 'offline';
      user.lastActive = new Date();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('franchiseId');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        franchiseId: user.franchiseId,
        onlineStatus: user.onlineStatus,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerFranchise,
  login,
  logout,
  getMe
};
