// thehellgrocery-backend/src/models/CartItem.js
module.exports = (sequelize, DataTypes) => {
    const CartItem = sequelize.define('CartItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        cartId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'carts', // อ้างถึงตาราง carts
                key: 'id'
            }
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products', // อ้างถึงตาราง products
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1 // จำนวนต้องอย่างน้อย 1
            }
        }
    }, {
        timestamps: true,
        tableName: 'cart_items', // กำหนดชื่อตาราง
        indexes: [
            { // สร้าง Unique Index เพื่อไม่ให้มี productId ซ้ำกันในตะกร้าเดียวกัน
                unique: true,
                fields: ['cartId', 'productId']
            }
        ]
    }, {
        tableName: 'cart_items',
        timestamps: true
    });

    CartItem.associate = (models) => {
        CartItem.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' });
        CartItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };

    return CartItem;
};