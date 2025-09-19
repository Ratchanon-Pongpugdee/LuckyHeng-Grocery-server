'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReviewReply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ReviewReply.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      ReviewReply.belongsTo(models.Review, { foreignKey: 'reviewId', as: 'review' });
    }
  }
  ReviewReply.init({
    reviewId: DataTypes.UUID,
    userId: DataTypes.UUID,
    comment: DataTypes.TEXT,
    imageUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ReviewReply',
  });
  return ReviewReply;
};