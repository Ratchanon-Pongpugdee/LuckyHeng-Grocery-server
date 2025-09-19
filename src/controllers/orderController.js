// thehellgrocery-backend/src/controllers/orderController.js
const { Order, OrderItem, Product, CartItem, Notification, User } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// ฟังก์ชันคำนวณ pickup deadline
const calculatePickupDeadline = () => {
    const now = new Date();
    const pickupTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // +8 ชั่วโมง
    
    // เช็คว่าหลัง 19:30 UTC+7 หรือไม่
    const todayCloseTime = new Date();
    todayCloseTime.setHours(19, 30, 0, 0); // 19:30 UTC+7
    
    // ถ้า pickupTime เกินเวลาปิด ให้เลื่อนไปวันถัดไป
    if (pickupTime > todayCloseTime) {
        pickupTime.setDate(pickupTime.getDate() + 1);
        pickupTime.setHours(19, 30, 0, 0);
    }
    
    return pickupTime;
};

// ฟังก์ชันสร้างการแจ้งเตือน
async function createNotification({ userId, message, type, link }) {
    return await Notification.create({ userId, message, type, link });
}

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (User must be authenticated)
exports.placeOrder = async (req, res) => {
    const { orderType = 'pickup', paymentMethod, shippingAddress } = req.body;
    const userId = req.user.id;

    const t = await sequelize.transaction();

    try {
        // paymentMethod no longer required; default to cash on pickup if missing
        const resolvedPaymentMethod = paymentMethod || 'cashOnPickup';

        // ตรวจสอบ orderType
        if (orderType === 'delivery' && !shippingAddress) {
            await t.rollback();
            return res.status(400).json({ message: 'Shipping address is required for delivery orders.' });
        }

        // 1. หา cart ของ user
        const cart = await require('../models').Cart.findOne({ where: { userId } });
        if (!cart) {
            await t.rollback();
            return res.status(400).json({ message: 'Cart not found.' });
        }

        // 2. ดึง cartItems ด้วย cartId
        const cartItems = await CartItem.findAll({
            where: { cartId: cart.id },
            include: [{ model: Product, as: 'product' }],
            transaction: t
        });

        if (cartItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Your cart is empty. Cannot place an order.' });
        }

        // 3. คำนวณราคารวมทั้งหมด
        let totalAmount = 0;
        for (const item of cartItems) {
            if (item.product.stock < item.quantity) {
                await t.rollback();
                return res.status(400).json({ message: `Insufficient stock for product: ${item.product.name}` });
            }
            totalAmount += item.product.price * item.quantity;
        }

        // 4. คำนวณ pickup deadline สำหรับ pickup orders
        const pickupDeadline = orderType === 'pickup' ? calculatePickupDeadline() : null;
        const storeLocation = orderType === 'pickup' ? '32/2 ถ.สมภารคง ต.รั้วใหญ่ อ.เมืองสุพรรณบุรี จ.สุพรรณบุรี 72000' : null;

        // 5. สร้าง Order
        const order = await Order.create({
            userId,
            totalAmount,
            orderType,
            shippingAddress: orderType === 'delivery' ? shippingAddress : null,
            paymentMethod: resolvedPaymentMethod,
            pickupDeadline,
            storeLocation,
            status: 'pending'
        }, { transaction: t });

        // 6. สร้าง Order Items และลดจำนวนสต็อกสินค้า
        const orderItemsData = [];
        for (const item of cartItems) {
            orderItemsData.push({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price
            });
            // ลดสต็อกสินค้า
            await Product.update(
                { stock: item.product.stock - item.quantity },
                { where: { id: item.productId }, transaction: t }
            );
        }
        await OrderItem.bulkCreate(orderItemsData, { transaction: t });

        // 7. ล้างตะกร้าสินค้า
        await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

        // Commit transaction
        await t.commit();

        // สร้าง response data
        const responseData = {
            message: 'Order placed successfully!',
            order,
            orderId: order.id
        };

        // เพิ่มข้อมูล pickup สำหรับ pickup orders
        if (orderType === 'pickup') {
            responseData.pickupDeadline = pickupDeadline.toISOString();
            responseData.storeLocation = storeLocation;
        }

            // แจ้งเตือนแอดมินเมื่อมีออเดอร์ใหม่
            // หา user ที่เป็น ADMIN ทั้งหมด
            const adminUsers = await User.findAll({ where: { role: 'ADMIN' } });
            for (const admin of adminUsers) {
                await createNotification({
                    userId: admin.id,
                    message: `มีคำสั่งซื้อใหม่จากลูกค้า (${req.user.username}) หมายเลขออเดอร์: ${order.id}`,
                    type: 'new_order',
                    link: `/admin/orders/${order.id}`
                });
            }
        res.status(201).json(responseData);

    } catch (error) {
        await t.rollback();
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get orders for a specific user
// @route   GET /api/orders/user/:userId
// @access  Private (User must be authenticated for their own orders)
exports.getUserOrders = async (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: You can only view your own orders or you are not an admin.' });
    }

    try {
        const orders = await Order.findAll({
            where: { userId: req.params.userId },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user.' });
        }

        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (User: owner or Admin)
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ]
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        // ตรวจสอบสิทธิ์: ลูกค้าดูได้เฉพาะ order ตัวเอง, แอดมินดูได้ทุก order
        if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own order.' });
        }
        return res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order by id:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product'
                    }]
                },
                {
                    model: require('../models').User,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching all orders (admin):', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Clear order history for current user (only delivered or cancelled)
// @route   DELETE /api/orders/user/clear-history
// @access  Private
exports.clearUserOrderHistory = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id;

        // Find eligible orders
        const eligibleOrders = await Order.findAll({
            where: { userId, status: { [Op.in]: ['picked_up', 'cancelled'] } },
            attributes: ['id'],
            transaction: t
        });
        if (eligibleOrders.length === 0) {
            await t.rollback();
            return res.status(200).json({ deleted: 0 });
        }
        const orderIds = eligibleOrders.map(o => o.id);

        // Delete items then orders
        await OrderItem.destroy({ where: { orderId: { [Op.in]: orderIds } }, transaction: t });
        const deleted = await Order.destroy({ where: { id: { [Op.in]: orderIds } }, transaction: t });

        await t.commit();
        return res.status(200).json({ deleted });
    } catch (error) {
        await t.rollback();
        console.error('Error clearing user order history:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Clear order history for all users or a specific user (admin only)
// @route   DELETE /api/orders/admin/clear-history
// @access  Private/Admin
exports.clearAdminOrderHistory = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { userId } = req.query;
        const where = { status: { [Op.in]: ['picked_up', 'cancelled'] } };
        if (userId) where.userId = userId;

        const eligibleOrders = await Order.findAll({ where, attributes: ['id'], transaction: t });
        if (eligibleOrders.length === 0) {
            await t.rollback();
            return res.status(200).json({ deleted: 0 });
        }
        const orderIds = eligibleOrders.map(o => o.id);

        await OrderItem.destroy({ where: { orderId: { [Op.in]: orderIds } }, transaction: t });
        const deleted = await Order.destroy({ where: { id: { [Op.in]: orderIds } }, transaction: t });

        await t.commit();
        return res.status(200).json({ deleted });
    } catch (error) {
        await t.rollback();
        console.error('Error clearing admin order history:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Update order status (for Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // อัปเดต valid statuses สำหรับ pickup system
        const validStatuses = ['pending', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid order status provided.' });
        }

        const oldStatus = order.status;
        order.status = status;
        
        // ถ้าสถานะเป็น ready_for_pickup ให้บันทึก pickupTime
        if (status === 'ready_for_pickup') {
            order.pickupTime = new Date();
        }
        
        await order.save();

        // สร้างการแจ้งเตือนให้ user
        const user = await User.findByPk(order.userId);
        if (user) {
            let message = '';
            let type = 'order_status';
            let link = `/orders/${order.id}`;
            
            switch (status) {
                case 'ready_for_pickup':
                    message = `สินค้าของคุณพร้อมรับแล้ว! กรุณามารับที่ร้านภายใน ${new Date(order.pickupDeadline).toLocaleString('th-TH')}`;
                    type = 'pickup_ready';
                    break;
                case 'picked_up':
                    message = 'ขอบคุณที่ใช้บริการ! สินค้าถูกรับเรียบร้อยแล้ว';
                    type = 'pickup_completed';
                    break;
                default:
                    message = `สถานะคำสั่งซื้อของคุณเปลี่ยนเป็น: ${status}`;
            }
            await createNotification({ userId: user.id, message, type, link });
        }

        return res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Allow cancellation only by the owner or an admin
        if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden: You are not allowed to cancel this order.' });
        }

        // Prevent cancellation if the order is already completed or cancelled
        if (['picked_up', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ message: `Cannot cancel an order with status: ${order.status}` });
        }

        order.status = 'cancelled';
        await order.save();

        return res.status(200).json({ message: 'Order cancelled successfully', order });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};