const express = require('express');
const { auth, ownerAuth } = require('../middleware/auth');
const { registerFranchiseRules, loginRules } = require('../middleware/validation');
const { registerFranchise, login, logout, getMe } = require('../controllers/authController');

const router = express.Router();

// Register a new franchise (Owner only)
router.post('/register', auth, ownerAuth, registerFranchiseRules, registerFranchise);

// Login user
router.post('/login', loginRules, login);

// Get current user
router.get('/me', auth, getMe);

// Logout user
router.post('/logout', auth, logout);

module.exports = router;
