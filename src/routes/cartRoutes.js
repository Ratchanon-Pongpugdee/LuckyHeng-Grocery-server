// thehellgrocery-backend/src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
// const authMiddleware = require('../middleware/authMiddleware'); // จะเพิ่มในภายหลังเมื่อมีการป้องกัน Route

// Get user's cart
router.get('/user/:userId', cartController.getUserCart); // ควรมี authMiddleware.authenticate

// Add item to cart
router.post('/add', cartController.addItemToCart); // ควรมี authMiddleware.authenticate

// Update cart item quantity
router.put('/update', cartController.updateCartItemQuantity); // ควรมี authMiddleware.authenticate

// Remove item from cart
router.delete('/remove', cartController.removeCartItem); // ควรมี authMiddleware.authenticate

// Clear user's cart
router.delete('/clear/:userId', cartController.clearCart); // ควรมี authMiddleware.authenticate

module.exports = router;