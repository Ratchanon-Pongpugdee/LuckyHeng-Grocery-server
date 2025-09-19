// thehellgrocery-backend/src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController'); // We will create this
const { authenticate } = require('../middleware/authMiddleware'); // ใช้ authenticate แทน protect
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Multer config สำหรับอัปโหลดรูปรีวิว/คอมเมนต์
const reviewImagesDir = path.join(__dirname, '../../../uploads/review-images');
if (!fs.existsSync(reviewImagesDir)) {
    fs.mkdirSync(reviewImagesDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, reviewImagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({ storage });

// Get all reviews for a specific product
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// Add a new review to a product (requires authentication)
router.post('/products/:productId/reviews', authenticate, upload.single('image'), reviewController.createReview);

// Update a specific review (requires authentication and ownership)
router.put('/:reviewId', authenticate, reviewController.updateReview); // Or /products/:productId/reviews/:reviewId

// Delete a specific review (requires authentication and ownership/admin)
router.delete('/:reviewId', authenticate, reviewController.deleteReview); // Or /products/:productId/reviews/:reviewId

// Like/unlike a review
router.post('/:reviewId/like', authenticate, reviewController.toggleLikeReview);

// Reply to a review (with image upload)
router.post('/:reviewId/reply', authenticate, upload.single('image'), reviewController.replyToReview);

// Delete a reply (ReviewReply)
router.delete('/replies/:replyId', authenticate, reviewController.deleteReply);

module.exports = router;