'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReviewLike extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ReviewLike.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      ReviewLike.belongsTo(models.Review, { foreignKey: 'reviewId', as: 'review' });
    }
  }
  ReviewLike.init({
    userId: DataTypes.UUID,
    reviewId: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'ReviewLike',
  });
  return ReviewLike;
};