const express = require('express');
const router = express.Router();
const {
  getSalesSummary,
  getBestSellingProducts,
  getOrderStatusDistribution,
} = require('../controllers/analyticsController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// @route   /api/analytics
router.get('/sales-summary', authenticate, authorizeAdmin('ADMIN'), getSalesSummary);
router.get('/best-selling-products', authenticate, authorizeAdmin('ADMIN'), getBestSellingProducts);
router.get('/order-status-distribution', authenticate, authorizeAdmin('ADMIN'), getOrderStatusDistribution);

module.exports = router; 