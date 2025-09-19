// thehellgrocery-backend/src/models/order.js
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        // เปลี่ยน shippingAddress เป็น optional
        shippingAddress: {
            type: DataTypes.TEXT,
            allowNull: true // เปลี่ยนจาก false เป็น true
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // เพิ่ม fields ใหม่สำหรับ pickup system
        orderType: {
            type: DataTypes.ENUM('delivery', 'pickup'),
            defaultValue: 'pickup',
            allowNull: false
        },
        pickupTime: {
            type: DataTypes.DATE,
            allowNull: true
        },
        pickupDeadline: {
            type: DataTypes.DATE,
            allowNull: true
        },
        storeLocation: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled'),
            defaultValue: 'pending',
            allowNull: false
        }
    });

    Order.associate = (models) => {
        Order.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: 'orderId',
            as: 'items',
            onDelete: 'CASCADE'
        });
    };

    return Order;
};