const express = require('express');
const { auth, producerAuth, distributorAuth } = require('../middleware/auth');
const {
  getDistributors,
  getDistributor,
  updateDistributor,
  deleteDistributor,
  getDistributorAnalytics
} = require('../controllers/distributorController');

const router = express.Router();

// Get all distributors (Producer only)
router.get('/', auth, producerAuth, getDistributors);

// Get distributor analytics (Producer only)
router.get('/analytics', auth, producerAuth, getDistributorAnalytics);

// Get single distributor (Producer or own distributor)
router.get('/:id', auth, getDistributor);

// Update distributor (Producer only)
router.put('/:id', auth, producerAuth, updateDistributor);

// Delete distributor (Producer only)
router.delete('/:id', auth, producerAuth, deleteDistributor);

module.exports = router;
