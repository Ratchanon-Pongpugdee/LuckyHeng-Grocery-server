module.exports = (sequelize, DataTypes) => {
    const UserProfile = sequelize.define('UserProfile', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        fullName: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        birthDate: { type: DataTypes.DATEONLY, allowNull: true },
        pronouns: { type: DataTypes.STRING, allowNull: true },
        facebook: { type: DataTypes.STRING, allowNull: true },
        instagram: { type: DataTypes.STRING, allowNull: true },
        lineId: { type: DataTypes.STRING, allowNull: true },
        twitter: { type: DataTypes.STRING, allowNull: true },
        tiktok: { type: DataTypes.STRING, allowNull: true },
        youtube: { type: DataTypes.STRING, allowNull: true },
        thread: { type: DataTypes.STRING, allowNull: true },
        linkedin: { type: DataTypes.STRING, allowNull: true },
        telegram: { type: DataTypes.STRING, allowNull: true },
        discord: { type: DataTypes.STRING, allowNull: true },
        snapchat: { type: DataTypes.STRING, allowNull: true },
        pinterest: { type: DataTypes.STRING, allowNull: true },
        reddit: { type: DataTypes.STRING, allowNull: true },
        twitch: { type: DataTypes.STRING, allowNull: true },
        vimeo: { type: DataTypes.STRING, allowNull: true },
        soundcloud: { type: DataTypes.STRING, allowNull: true },
        spotify: { type: DataTypes.STRING, allowNull: true },
        github: { type: DataTypes.STRING, allowNull: true },
        notifyPickup: { type: DataTypes.BOOLEAN, defaultValue: true },
        notifyPromotion: { type: DataTypes.BOOLEAN, defaultValue: true },
        notifySystem: { type: DataTypes.BOOLEAN, defaultValue: true },
        isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
        allowLikes: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        tableName: 'user_profiles',
        timestamps: true
    });

    UserProfile.associate = (models) => {
        UserProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return UserProfile;
};

