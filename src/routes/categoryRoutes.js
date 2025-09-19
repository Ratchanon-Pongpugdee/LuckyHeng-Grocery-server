// thehellgrocery-backend/src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware'); // Assuming you have protect and authorize middleware

// Public route to get all categories
router.get('/', categoryController.getCategories);

// Admin-only routes
router.post('/', authenticate, authorizeAdmin(['ADMIN']), categoryController.createCategory);
router.put('/:id', authenticate, authorizeAdmin(['ADMIN']), categoryController.updateCategory);
router.delete('/:id',authenticate, authorizeAdmin(['ADMIN']), categoryController.deleteCategory);

module.exports = router;