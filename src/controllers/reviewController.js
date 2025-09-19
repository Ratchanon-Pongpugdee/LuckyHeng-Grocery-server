// thehellgrocery-backend/src/controllers/reviewController.js
const { Review, Product, User, ReviewLike, ReviewReply } = require('../models'); // Import Review, Product, User models and ReviewLike, ReviewReply
const path = require('path');
const fs = require('fs');
const notificationController = require('./notificationController');
const { sendNotificationToUser } = require('../utils/socket');

// @desc    Get all reviews for a specific product
// @route   GET /api/reviews/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.findAll({
            where: { productId },
            include: [
                {
                    model: User,
                    as: 'user', // เพิ่ม as ให้ตรงกับ associate
                    attributes: ['id', 'username', 'profileImage'], // Include user info (แก้ไขจาก profileImageUrl เป็น profileImage)
                },
                {
                    model: ReviewLike,
                    as: 'likes',
                    attributes: ['userId'],
                },
                {
                    model: ReviewReply,
                    as: 'replies',
                    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profileImage'] }],
                }
            ],
            order: [['createdAt', 'DESC']], // Latest reviews first
        });
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error in getProductReviews:', error);
        res.status(500).json({ success: false, message: 'Server error fetching reviews.', error: error.message, stack: error.stack });
    }
};

// Helper: ดึง username ที่ถูก mention จากข้อความ
function extractMentions(text) {
    if (!text) return [];
    // @username (ภาษาอังกฤษ/ตัวเลข/._-)
    const matches = text.match(/@([a-zA-Z0-9_.-]+)/g) || [];
    return matches.map(m => m.slice(1));
}

// @desc    Create a new review for a product
// @route   POST /api/reviews/products/:productId/reviews
// @access  Private
exports.createReview = async (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id; // From protect middleware
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/review-images/${req.file.filename}`;
    }

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating is required and must be between 1 and 5.' });
    }

    try {
        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        // Optional: Check if user has already reviewed this product
        // const existingReview = await Review.findOne({ where: { productId, userId } });
        // if (existingReview) {
        //     return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
        // }

        const review = await Review.create({
            productId,
            userId,
            rating,
            comment: comment || null,
            imageUrl,
        });

        // แจ้งเตือน mention
        const mentions = extractMentions(comment);
        if (mentions.length > 0) {
            const users = await User.findAll({ where: { username: mentions } });
            for (const u of users) {
                if (u.id !== userId) {
                    await notificationController.createNotification(u.id, `${req.user.username} กล่าวถึงคุณในความคิดเห็น`, 'mention', `/products/${productId}`);
                }
            }
        }

        // Optionally, update product's average rating and number of reviews here
        // (This would require adding fields to Product model)
        // const allReviewsForProduct = await Review.findAll({ where: { productId } });
        // const avgRating = allReviewsForProduct.reduce((acc, r) => acc + r.rating, 0) / allReviewsForProduct.length;
        // await product.update({ avgRating: avgRating, numReviews: allReviewsForProduct.length });

        // sendNotificationToUser(req.app, targetUserId, notificationData);

        res.status(201).json({ success: true, message: 'Review created successfully.', review });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error creating review.' });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private (Owner only)
exports.updateReview = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating is required and must be between 1 and 5.' });
    }

    try {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Check if the user is the owner of the review
        if (review.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this review.' });
        }

        review.rating = rating;
        review.comment = comment || null;
        await review.save();

        res.status(200).json({ success: true, message: 'Review updated successfully.', review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error updating review.' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin; // Assuming your user object from auth middleware has isAdmin field

    try {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Check if the user is the owner or an admin
        if (review.userId !== userId && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
        }

        await review.destroy();
        res.status(200).json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error deleting review.' });
    }
};
// Like/unlike a review
exports.toggleLikeReview = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    try {
        const review = await Review.findByPk(reviewId);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        const existingLike = await ReviewLike.findOne({ where: { reviewId, userId } });
        if (existingLike) {
            await existingLike.destroy();
        } else {
            await ReviewLike.create({ reviewId, userId });
            // แจ้งเตือนเจ้าของรีวิว (ถ้าไม่ใช่ตัวเอง)
            if (review.userId !== userId) {
                await notificationController.createNotification(
                    review.userId,
                    `${req.user.username} ถูกใจความคิดเห็นของคุณ`,
                    'like',
                    `/products/${review.productId}`
                );
            }
        }
        // Return updated like count
        const likeCount = await ReviewLike.count({ where: { reviewId } });
        res.json({ success: true, likeCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error toggling like.' });
    }
};

// Reply to a review (รองรับ image, validate, return reply พร้อม user info)
exports.replyToReview = async (req, res) => {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/review-images/${req.file.filename}`;
    }
    try {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        if (!comment && !imageUrl) {
            return res.status(400).json({ success: false, message: 'Reply must have text or image.' });
        }
        const reply = await ReviewReply.create({
            reviewId,
            userId,
            comment: comment || null,
            imageUrl,
        });
        // แจ้งเตือนเจ้าของรีวิว (ถ้าไม่ใช่ตัวเอง)
        if (review.userId !== userId) {
            await notificationController.createNotification(
                review.userId,
                `${req.user.username} ได้ตอบกลับความคิดเห็น`,
                'reply',
                `/products/${review.productId}`
            );
        }
        // แจ้งเตือน mention
        const mentions = extractMentions(comment);
        if (mentions.length > 0) {
            const users = await User.findAll({ where: { username: mentions } });
            for (const u of users) {
                if (u.id !== userId) {
                    await notificationController.createNotification(u.id, `${req.user.username} ได้กล่าวถึงคุณในความคิดเห็น`, 'mention', `/products/${review.productId}`);
                }
            }
        }
        // ดึง user info กลับไปด้วย
        const replyWithUser = await ReviewReply.findByPk(reply.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profileImage'] }]
        });
        res.status(201).json({ success: true, message: 'Reply created successfully.', reply: replyWithUser });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error creating reply.' });
    }
};

exports.deleteReply = async (req, res) => {
    const { replyId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;
    try {
        const reply = await ReviewReply.findByPk(replyId);
        if (!reply) return res.status(404).json({ success: false, message: 'Reply not found.' });
        if (reply.userId !== userId && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized to delete this reply.' });
        await reply.destroy();
        res.status(200).json({ success: true, message: 'Reply deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error deleting reply.' });
    }
};
