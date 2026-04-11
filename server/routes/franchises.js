const express = require('express');
const { auth, ownerAuth, franchiseAuth } = require('../middleware/auth');
const { franchiseUpdateRules, mongoIdParamRules } = require('../middleware/validation');
const {
  getFranchises,
  getFranchise,
  getFranchiseDetails,
  updateFranchise,
  deleteFranchise,
  getFranchiseAnalytics,
  getFranchiseAllocations
} = require('../controllers/franchiseController');

const router = express.Router();

// Get all franchises (Owner only)
router.get('/', auth, ownerAuth, getFranchises);

// Get franchise analytics (Owner only)
router.get('/analytics', auth, ownerAuth, getFranchiseAnalytics);

// Get single franchise (Owner or own franchise)
router.get('/:id', auth, mongoIdParamRules('id'), getFranchise);

// Get franchise details with shops, sales, returns (Owner only)
router.get('/:id/details', auth, ownerAuth, mongoIdParamRules('id'), getFranchiseDetails);

// Update franchise (Owner only)
router.put('/:id', auth, ownerAuth, mongoIdParamRules('id'), franchiseUpdateRules, updateFranchise);

// Delete franchise (Owner only)
router.delete('/:id', auth, ownerAuth, mongoIdParamRules('id'), deleteFranchise);

// Get franchise allocation history (Franchise or Owner)
router.get('/:id/allocations', auth, franchiseAuth, mongoIdParamRules('id'), getFranchiseAllocations);

module.exports = router;
