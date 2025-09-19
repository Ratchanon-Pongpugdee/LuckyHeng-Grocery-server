// thehellgrocery-backend/src/models/Review.js
module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'id',
            },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
    }, {
        tableName: 'Reviews',
        timestamps: true,
    });

    Review.associate = (models) => {
        Review.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
        Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Review.hasMany(models.ReviewLike, { foreignKey: 'reviewId', as: 'likes' });
        Review.hasMany(models.ReviewReply, { foreignKey: 'reviewId', as: 'replies' });
    };

    return Review;
};