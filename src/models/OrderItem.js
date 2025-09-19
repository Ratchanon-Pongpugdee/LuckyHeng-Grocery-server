// thehellgrocery-backend/src/models/orderItem.js
module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            }
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: { // ราคาของสินค้า ณ เวลาที่สั่งซื้อ (อาจแตกต่างจากราคาปัจจุบันของสินค้า)
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    });

    OrderItem.associate = (models) => {
        OrderItem.belongsTo(models.Order, {
            foreignKey: 'orderId',
            onDelete: 'CASCADE'
        });
        OrderItem.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product' // <--- ต้องมี alias นี้
        });
    };

    return OrderItem;
};