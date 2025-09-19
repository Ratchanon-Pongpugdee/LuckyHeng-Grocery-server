// thehellgrocery-backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// ทุกคนที่ login แล้วเข้ามาได้
router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-as-read', notificationController.markAllAsRead);

// ถ้าอยากให้ลบ notification ได้เฉพาะ admin
// router.delete('/:id', authorizeAdmin(['ADMIN']), notificationController.deleteNotification);
// หรือถ้าให้ user ลบของตัวเองได้ (ตาม logic controller) ก็ไม่ต้อง authorizeAdmin
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;