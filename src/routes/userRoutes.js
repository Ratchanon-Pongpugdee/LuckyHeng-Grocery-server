// thehellgrocery-backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware'); // Import middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads/profile-images directory if it doesn't exist
const profileImagesDir = path.join(__dirname, '../../../uploads/profile-images');
if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
}

// Multer configuration for profile image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileImagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, req.user.id + ext);
    }
});
const upload = multer({ storage });

// Routes for user profiles (Private, for authenticated users)
router.get('/profile', authenticate, userController.getUserProfile);
router.put('/profile', authenticate, userController.updateUserProfile);
// Upload profile image (authenticated user)
router.post('/profile-image', authenticate, upload.single('profileImage'), userController.uploadProfileImage);

// Routes สำหรับแอดมินในการจัดการผู้ใช้คนอื่น
router.get('/', authenticate, authorizeAdmin(['ADMIN']), userController.getAllUsers); // Get all users (admin)
router.put('/:id', authenticate, authorizeAdmin(['ADMIN']), userController.updateUserByAdmin); // Update user by admin
router.put('/:id/role', authenticate, authorizeAdmin(['ADMIN']), userController.updateUserRole); // Update user role by admin
router.delete('/:id', authenticate, authorizeAdmin(['ADMIN']), userController.deleteUserByAdmin); // Delete user by admin

router.get('/public/:userId', userController.getPublicProfile);
router.post('/:userId/like', userController.likeUser);
router.post('/:userId/unlike', userController.unlikeUser);

module.exports = router;