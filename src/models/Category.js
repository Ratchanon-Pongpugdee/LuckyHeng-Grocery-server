module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'Categories',
        timestamps: true,
    });

    // ถ้ามี Product model ให้เพิ่ม association แบบนี้
    Category.associate = (models) => {
        Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
    };

    return Category;
}