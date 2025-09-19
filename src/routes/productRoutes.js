// thehellgrocery-backend/src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware'); // <--- Import middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage for product images
const uploadDir = path.join(__dirname, '../../uploads/products');
try {
	fs.mkdirSync(uploadDir, { recursive: true });
} catch (_) {}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname);
		const base = path
			.basename(file.originalname, ext)
			.replace(/\s+/g, '_')
			.replace(/[^\w\-]/g, '');
		cb(null, `${Date.now()}_${base}${ext}`);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Public routes for products
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories); // <--- เพิ่ม endpoint สำหรับ categories
router.get('/stock-report', authenticate, authorizeAdmin(['ADMIN']), productController.getStockReport);
router.get('/:id', productController.getProductById);

// Admin-only routes for product management
// ใช้ authenticate ก่อนเพื่อยืนยันตัวตน จากนั้นใช้ authorizeAdmin เพื่อตรวจสอบสิทธิ์
router.post('/', authenticate, authorizeAdmin(['ADMIN']), upload.single('image'), productController.createProduct);
router.put('/:id', authenticate, authorizeAdmin(['ADMIN']), upload.single('image'), productController.updateProduct);
router.delete('/:id', authenticate, authorizeAdmin(['ADMIN']), productController.deleteProduct);

module.exports = router;