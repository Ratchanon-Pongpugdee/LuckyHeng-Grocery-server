// thehellgrocery-backend/src/models/User.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // แก้ไขตรงนี้: ใช้ ENUM เพื่อจำกัดค่าที่รับได้
        role: {
            type: DataTypes.ENUM('USER', 'ADMIN'), // <--- เปลี่ยนเป็น ENUM และกำหนดค่าที่อนุญาต
            defaultValue: 'USER', // กำหนดค่าเริ่มต้น
            allowNull: false
        },
        profileImage: {
            type: DataTypes.STRING,
            allowNull: true, // ต้องตรงกับใน migration
            defaultValue: null
        }
    }, {
        timestamps: true,
        tableName: 'users'
    }, {
        tableName: 'users',
        timestamps: true
    });

    User.associate = (models) => {
        // User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' }); // ถ้ามี Order Model
        // User.hasOne(models.Cart, { foreignKey: 'userId', as: 'cart' }); // ถ้ามี Cart Model
        // Like system
        User.belongsToMany(models.User, {
            as: 'LikedUsers',
            through: 'UserLike',
            foreignKey: 'userId',
            otherKey: 'likedUserId',
        });
        User.belongsToMany(models.User, {
            as: 'LikedByUsers',
            through: 'UserLike',
            foreignKey: 'likedUserId',
            otherKey: 'userId',
        });
    };

    return User;
};