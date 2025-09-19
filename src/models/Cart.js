// thehellgrocery-backend/src/models/Cart.js
module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // ผู้ใช้หนึ่งคนมีตะกร้าเดียว
            references: {
                model: 'users', // อ้างถึงตาราง users
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        tableName: 'carts'
    }, {
        tableName: 'carts',
        timestamps: true
    });

    Cart.associate = (models) => {
        Cart.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Cart.hasMany(models.CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
    };

    return Cart;
};