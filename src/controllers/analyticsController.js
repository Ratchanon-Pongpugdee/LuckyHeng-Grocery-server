const { Order, OrderItem, Product, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to create a date filter from query params
const createDateFilter = (query) => {
    const { startDate, endDate } = query;
    if (!startDate || !endDate) {
        // Return a default filter for the last 30 days if no range is provided
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return { createdAt: { [Op.gte]: thirtyDaysAgo } };
    }
    const finalEndDate = new Date(endDate);
    finalEndDate.setHours(23, 59, 59, 999); // Include the whole end day
    return { createdAt: { [Op.between]: [new Date(startDate), finalEndDate] } };
};

// @desc    Get Sales Summary
// @route   GET /api/analytics/sales-summary
// @access  Private/Admin
exports.getSalesSummary = async (req, res) => {
  try {
    const dateFilter = createDateFilter(req.query);

    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: 'picked_up', ...dateFilter },
    });

    const totalOrders = await Order.count({ where: dateFilter });

    // Debug log for dateFilter and new customer query
    console.log('Date filter for newCustomers:', dateFilter);
    // นับลูกค้าใหม่ทั้งหมด (role: 'Customer')
    // newCustomers ไม่สนใจ dateFilter (นับลูกค้าใหม่ทั้งหมด)
    // ดึงข้อมูลลูกค้าใหม่ทั้งหมด
    const customers = await User.findAll({
      where: {
        role: 'USER'
      }
    });
    console.log('DEBUG customers:', customers);
    const newCustomers = customers.length;
    console.log('DEBUG newCustomers:', newCustomers);
    console.log('New customers counted:', newCustomers);
    
    // Sales data for the selected range for a chart
    const salesData = await Order.findAll({
        attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('SUM', sequelize.col('totalAmount')), 'dailySales']
        ],
        where: {
            status: 'picked_up',
            ...dateFilter
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });


    res.status(200).json({
      totalRevenue: totalRevenue || 0,
      totalOrders,
      newCustomers,
      salesData
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get Best Selling Products
// @route   GET /api/analytics/best-selling-products
// @access  Private/Admin
exports.getBestSellingProducts = async (req, res) => {
  try {
    const dateFilter = createDateFilter(req.query);

    // Step 1: Find all order IDs that match the date and status criteria
    const orders = await Order.findAll({
      where: {
        status: 'picked_up',
        ...dateFilter,
      },
      attributes: ['id'],
      raw: true,
    });

    const orderIds = orders.map(o => o.id);
    
    // If no orders match, return an empty array
    if (orderIds.length === 0) {
      return res.status(200).json([]);
    }

    // Step 2: Find best selling products from those orders
    const bestSellingProducts = await OrderItem.findAll({
      where: {
        orderId: {
          [Op.in]: orderIds,
        },
      },
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'price', 'imageUrl']
      }],
      group: ['productId', 'product.id', 'product.name', 'product.price', 'product.imageUrl'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 5,
    });

    res.status(200).json(bestSellingProducts);
  } catch (error) {
    console.error('Error fetching best selling products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get Order Status Distribution
// @route   GET /api/analytics/order-status-distribution
// @access  Private/Admin
exports.getOrderStatusDistribution = async (req, res) => {
  try {
    const dateFilter = createDateFilter(req.query);
    
    const statusDistribution = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
      ],
      where: dateFilter,
      group: ['status'],
    });

    // Format data for easier use on the frontend
    const formattedDistribution = statusDistribution.reduce((acc, item) => {
        acc[item.status] = item.get('count');
        return acc;
    }, {});


    res.status(200).json(formattedDistribution);
  } catch (error) {
    console.error('Error fetching order status distribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 