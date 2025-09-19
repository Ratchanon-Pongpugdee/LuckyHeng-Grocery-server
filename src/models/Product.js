// thehellgrocery-backend/src/models/product.js
module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        imageUrl: {
            type: DataTypes.STRING, // URL ของรูปภาพสินค้า
            allowNull: true
        },
        category: { // <--- ตรวจสอบหรือเพิ่ม field นี้!
            type: DataTypes.STRING, // เช่น 'Fruits', 'Vegetables', 'Dairy', 'Meat', etc.
            allowNull: true // หรือ false ถ้าทุกสินค้าต้องมีหมวดหมู่
        }
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'Category' });
        Product.hasMany(models.CartItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
        Product.hasMany(models.OrderItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
    };

    return Product;
};