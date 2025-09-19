// thehellgrocery-backend/src/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require(__dirname + '/../../config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models
db.User = require('./User')(sequelize, DataTypes);
db.Product = require('./Product')(sequelize, DataTypes);
db.Cart = require('./Cart')(sequelize, DataTypes);       // <--- เพิ่มบรรทัดนี้
db.CartItem = require('./CartItem')(sequelize, DataTypes); // <--- เพิ่มบรรทัดนี้
db.Order = require('./Order')(sequelize, DataTypes);
db.OrderItem = require('./OrderItem')(sequelize, DataTypes);
db.Review = require('./Review')(sequelize, DataTypes); // <--- เพิ่มบรรทัดนี้
db.Category = require('./Category')(sequelize, DataTypes); // <--- เพิ่มบรรทัดนี้
db.Notification = require('./Notification')(sequelize, DataTypes); // <--- เพิ่มบรรทัดนี้
db.UserLike = require('./UserLike')(sequelize, DataTypes); // เพิ่ม UserLike model
db.ReviewLike = require('./reviewlike')(sequelize, DataTypes); // เพิ่ม ReviewLike model
db.ReviewReply = require('./reviewreply')(sequelize, DataTypes); // เพิ่ม ReviewReply model
db.ContactMessage = require('./ContactMessage')(sequelize, DataTypes); // เพิ่ม ContactMessage model
db.UserProfile = require('./UserProfile')(sequelize, DataTypes); // เพิ่ม UserProfile model
// ตั้งค่า Associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;