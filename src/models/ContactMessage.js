// server/src/models/ContactMessage.js
module.exports = (sequelize, DataTypes) => {
    const ContactMessage = sequelize.define('ContactMessage', {
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
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'contact_messages',
        timestamps: true
    });

    return ContactMessage;
}; 