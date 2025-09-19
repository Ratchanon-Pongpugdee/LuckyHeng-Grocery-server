// thehellgrocery-backend/src/controllers/userController.js
const { User, UserLike, Review, ReviewLike, ReviewReply, Cart, CartItem, Order, OrderItem, Notification, UserProfile, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config สำหรับอัปโหลดรูปโปรไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/profile-images'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, req.user.id + ext);
    }
});
const upload = multer({ storage });

// @desc    Get user profile (authenticated user)
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    // req.user ถูกตั้งค่าโดย authMiddleware.authenticate
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found or not authenticated.' });
        }
        // ไม่ส่ง password กลับไป และแนบโปรไฟล์เสริม
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        const profile = await UserProfile.findOne({ where: { userId: req.user.id } });
        const merged = {
            ...user.toJSON(),
            ...(profile ? profile.toJSON() : {})
        };
        res.status(200).json(merged);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile (authenticated user)
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    // req.user ถูกตั้งค่าโดย authMiddleware.authenticate
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found or not authenticated.' });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const {
            username, email, password,
            fullName, phone, birthDate, pronouns,
            facebook, instagram, lineId, twitter, tiktok, youtube, thread, linkedin, telegram, discord, snapchat, pinterest, reddit, twitch, vimeo, soundcloud, spotify, github,
            notifyPickup, notifyPromotion, notifySystem, isPublic, allowLikes
        } = req.body;

        // อัปเดตเฉพาะ field ที่มีการส่งมา
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) {
            // Hash รหัสผ่านใหม่ถ้ามีการส่งมา
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        // upsert โปรไฟล์เสริม
        const [profile] = await UserProfile.findOrCreate({
            where: { userId: req.user.id },
            defaults: { userId: req.user.id }
        });
        const patch = {
            fullName, phone, pronouns, facebook, instagram, lineId, twitter, tiktok, youtube, thread, linkedin, telegram, discord, snapchat, pinterest, reddit, twitch, vimeo, soundcloud, spotify, github,
        };
        if (typeof notifyPickup !== 'undefined') patch.notifyPickup = !!notifyPickup;
        if (typeof notifyPromotion !== 'undefined') patch.notifyPromotion = !!notifyPromotion;
        if (typeof notifySystem !== 'undefined') patch.notifySystem = !!notifySystem;
        if (typeof isPublic !== 'undefined') patch.isPublic = !!isPublic;
        if (typeof allowLikes !== 'undefined') patch.allowLikes = !!allowLikes;
        if (typeof birthDate !== 'undefined') patch.birthDate = birthDate || null;
        await profile.update(patch);

        // โหลดข้อมูลใหม่รวมกัน
        const updatedUser = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        const updatedProfile = await UserProfile.findOne({ where: { userId: req.user.id } });
        const merged = { ...updatedUser.toJSON(), ...(updatedProfile ? updatedProfile.toJSON() : {}) };

        res.status(200).json({ message: 'Profile updated successfully', user: merged });

    } catch (error) {
        console.error('Error updating user profile:', error);
        // ตรวจสอบ Unique constraint violation สำหรับ email
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email is already registered. Please use a different email.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users (Admin only) - เพิ่มในภายหลัง ถ้าต้องการ User Management ของ Admin
// @route   GET /api/users/
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user role (Admin only) - เพิ่มในภายหลัง ถ้าต้องการ User Management ของ Admin
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!['USER', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Role must be USER or ADMIN.' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ message: 'User role updated successfully', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user by admin (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (username) user.username = username;
        if (email) user.email = email;
        if (role && ['USER', 'ADMIN'].includes(role)) user.role = role;
        await user.save();
        res.status(200).json({ message: 'User updated successfully', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error updating user by admin:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete user by admin (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUserByAdmin = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        // 1) Remove likes where this user is liker or likee
        await UserLike.destroy({ where: { [Op.or]: [{ userId: id }, { likedUserId: id }] }, transaction: t });

        // 2) Remove notifications for this user
        if (Notification?.destroy) {
            await Notification.destroy({ where: { userId: id }, transaction: t });
        }

        // 3) Remove cart and items
        const cart = await Cart.findOne({ where: { userId: id }, transaction: t });
        if (cart) {
            await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
            await cart.destroy({ transaction: t });
        }

        // 4) Remove reviews, with their likes and replies
        const userReviews = await Review.findAll({ where: { userId: id }, attributes: ['id'], transaction: t });
        if (userReviews.length > 0) {
            const reviewIds = userReviews.map(r => r.id);
            if (ReviewLike?.destroy) {
                await ReviewLike.destroy({ where: { reviewId: { [Op.in]: reviewIds } }, transaction: t });
            }
            if (ReviewReply?.destroy) {
                await ReviewReply.destroy({ where: { reviewId: { [Op.in]: reviewIds } }, transaction: t });
            }
            await Review.destroy({ where: { id: { [Op.in]: reviewIds } }, transaction: t });
        }

        // 5) Remove orders and their items
        const orders = await Order.findAll({ where: { userId: id }, attributes: ['id'], transaction: t });
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            await OrderItem.destroy({ where: { orderId: { [Op.in]: orderIds } }, transaction: t });
            await Order.destroy({ where: { id: { [Op.in]: orderIds } }, transaction: t });
        }

        // 6) Remove user profile if exists
        if (UserProfile?.destroy) {
            await UserProfile.destroy({ where: { userId: id }, transaction: t });
        }

        // 7) Finally remove the user
        await user.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting user by admin:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload profile image
// @route   POST /api/users/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const user = await User.findByPk(req.user.id);
        if (!user) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'User not found.' });
        }
        // ลบไฟล์เก่าถ้ามี
        if (user.profileImage && fs.existsSync(path.join(__dirname, '../../', user.profileImage))) {
            fs.unlinkSync(path.join(__dirname, '../../', user.profileImage));
        }
        user.profileImage = `/uploads/profile-images/${req.file.filename}`;
        await user.save();
        res.json({ profileImage: user.profileImage });
    } catch (err) {
        console.error('Error uploading profile image:', err);
        res.status(500).json({ message: 'Failed to update profile image.' });
    }
};

// @desc    Get public profile
// @route   GET /api/users/public/:userId
// @access  Public or Authenticated
exports.getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        // Count likes
        const likesCount = await UserLike.count({ where: { likedUserId: userId } });
        // Check if current user liked this profile
        let likedByMe = false;
        if (req.user) {
            const like = await UserLike.findOne({ where: { userId: req.user.id, likedUserId: userId } });
            likedByMe = !!like;
        }
        res.json({ user, likesCount, likedByMe });
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Like a user profile
// @route   POST /api/users/:userId/like
// @access  Private
exports.likeUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user.id === userId) return res.status(400).json({ message: 'You cannot like your own profile.' });
        // Check if already liked
        const [like, created] = await UserLike.findOrCreate({ where: { userId: req.user.id, likedUserId: userId } });
        if (!created) return res.status(400).json({ message: 'You already liked this profile.' });
        res.json({ message: 'Profile liked.' });
    } catch (error) {
        console.error('Error liking user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Unlike a user profile
// @route   POST /api/users/:userId/unlike
// @access  Private
exports.unlikeUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user.id === userId) return res.status(400).json({ message: 'You cannot unlike your own profile.' });
        const like = await UserLike.findOne({ where: { userId: req.user.id, likedUserId: userId } });
        if (!like) return res.status(400).json({ message: 'You have not liked this profile.' });
        await like.destroy();
        res.json({ message: 'Profile unliked.' });
    } catch (error) {
        console.error('Error unliking user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};