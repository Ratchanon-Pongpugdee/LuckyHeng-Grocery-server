// thehellgrocery-backend/src/controllers/notificationController.js
const { Notification, User } = require('../models');

// Helper function to create a notification (can be called by other controllers)
const createNotification = async (userId, message, type = 'system', link = null) => {
    try {
        await Notification.create({ userId, message, type, link });
        // Optional: Implement real-time push here if using Socket.IO
        // io.to(userId).emit('newNotification', { message, type, link });
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
};

// @desc    Get all notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
        });

        // It's better to return an empty array with a 200 status if no notifications are found.
        // The frontend can handle an empty array gracefully.
        return res.status(200).json({ success: true, notifications: notifications || [] });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (Owner only)
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        // Ensure user owns the notification
        if (notification.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this notification.' });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({ success: true, message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error marking notification as read.' });
    }
};

// @desc    Mark all notifications for the authenticated user as read
// @route   PUT /api/notifications/mark-all-as-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { userId: req.user.id, isRead: false } }
        );
        return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error marking all notifications as read.' });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Owner only)
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        // Ensure user owns the notification
        if (notification.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this notification.' });
        }

        await notification.destroy();
        return res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error deleting notification.' });
    }
};

// Export the helper function so other controllers can use it
exports.createNotification = createNotification;