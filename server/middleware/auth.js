const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const ownerAuth = (req, res, next) => {
  console.log('[ownerAuth] Checking role:', req.user?.role);
  // Super admin can access everything
  if (req.user.role === 'super_admin') {
    return next();
  }
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Owner role required.' });
  }
  next();
};

const franchiseAuth = (req, res, next) => {
  console.log('[franchiseAuth] Checking role:', req.user?.role);
  if (req.user.role !== 'franchise') {
    return res.status(403).json({ message: 'Access denied. Franchise role required.' });
  }
  next();
};

const franchiseOrOwnerAuth = (req, res, next) => {
  // Super admin can access everything
  if (req.user.role === 'super_admin') {
    return next();
  }
  if (req.user.role !== 'franchise' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Franchise or Owner role required.' });
  }
  next();
};

// Super Admin only - highest privilege level
const superAdminAuth = (req, res, next) => {
  console.log('[superAdminAuth] Checking role:', req.user?.role);
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

// Super access - allows super_admin, owner (for shared admin functions)
const superAuth = (req, res, next) => {
  console.log('[superAuth] Checking role:', req.user?.role);
  if (!['super_admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
  }
  next();
};

// Role hierarchy check helper
const requireRole = (minRole) => {
  const roleHierarchy = {
    'super_admin': 4,
    'owner': 3,
    'franchise': 2,
    'distributor': 1
  };
  
  return (req, res, next) => {
    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;
    
    if (userRoleLevel < requiredLevel) {
      return res.status(403).json({ 
        message: `Access denied. Requires ${minRole} role or higher.` 
      });
    }
    next();
  };
};

module.exports = { 
  auth, 
  ownerAuth, 
  franchiseAuth, 
  franchiseOrOwnerAuth, 
  superAdminAuth, 
  superAuth,
  requireRole 
};
