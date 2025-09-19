module.exports = (sequelize, DataTypes) => {
    const UserLike = sequelize.define('UserLike', {
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
        likedUserId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'user_likes',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'likedUserId']
            }
        ]
    });
    return UserLike;
}; 