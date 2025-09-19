const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware'); // <--- Import middleware

// Admin-only routes for order management
router.get('/admin', authenticate, authorizeAdmin(['ADMIN']), orderController.getAllOrders);
router.put('/admin/:id/status', authenticate, authorizeAdmin(['ADMIN']), orderController.updateOrderStatus);
router.delete('/admin/clear-history', authenticate, authorizeAdmin(['ADMIN']), orderController.clearAdminOrderHistory);

// User routes for orders
router.post('/', authenticate, orderController.placeOrder);
router.get('/user/:userId', authenticate, orderController.getUserOrders); // Protected: user can only view their own orders or if they are admin
router.put('/:id/cancel', authenticate, orderController.cancelOrder); // User cancel order
router.get('/:id', authenticate, orderController.getOrderById);
router.delete('/user/clear-history', authenticate, orderController.clearUserOrderHistory);

module.exports = router;