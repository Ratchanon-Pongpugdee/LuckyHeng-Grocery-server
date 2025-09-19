// thehellgrocery-backend/src/controllers/cartController.js
const { Cart, CartItem, Product } = require('../models');

// Helper function to get or create a cart for a user
const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({
        where: { userId },
        include: [{
            model: CartItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }] // Include product details for each item
        }]
    });

    if (!cart) {
        cart = await Cart.create({ userId });
        // Fetch it again to include items correctly
        cart = await Cart.findOne({
            where: { userId },
            include: [{
                model: CartItem,
                as: 'items',
                include: [{ model: Product, as: 'product' }]
            }]
        });
    }
    return cart;
};

// @desc    Get user's cart
// @route   GET /api/carts/user/:userId
// @access  Private (User must be authenticated)
exports.getUserCart = async (req, res) => {
    try {
        const { userId } = req.params;
        // ตรวจสอบว่า userId ที่ส่งมาตรงกับ req.user.id (ถ้ามี Auth middleware)
        // if (req.user && req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Forbidden: You can only view your own cart' });
        // }
        const cart = await getOrCreateCart(userId);
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error getting user cart:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add item to cart
// @route   POST /api/carts/add
// @access  Private (User must be authenticated)
exports.addItemToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;
    try {
        // ตรวจสอบว่า userId ที่ส่งมาตรงกับ req.user.id (ถ้ามี Auth middleware)
        // if (req.user && req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Forbidden: You can only add to your own cart' });
        // }

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: `Not enough stock. Only ${product.stock} left.` });
        }

        const cart = await getOrCreateCart(userId);

        let cartItem = await CartItem.findOne({
            where: { cartId: cart.id, productId }
        });

        if (cartItem) {
            // Update quantity if item already exists
            const newQuantity = cartItem.quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({ message: `Cannot add more. Total quantity would exceed stock (${product.stock}).` });
            }
            cartItem.quantity = newQuantity;
            await cartItem.save();
        } else {
            // Add new item to cart
            cartItem = await CartItem.create({ cartId: cart.id, productId, quantity });
        }

        // Fetch the updated cart with product details
        const updatedCart = await getOrCreateCart(userId);
        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/carts/update
// @access  Private (User must be authenticated)
exports.updateCartItemQuantity = async (req, res) => {
    const { userId, productId, quantity } = req.body;
    try {
        // if (req.user && req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Forbidden: You can only update your own cart' });
        // }

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: `Not enough stock. Only ${product.stock} left.` });
        }
        if (quantity <= 0) { // If quantity is 0 or less, remove the item
            await removeCartItem(req, res); // Reuse remove function
            return;
        }

        const cart = await getOrCreateCart(userId);
        const cartItem = await CartItem.findOne({
            where: { cartId: cart.id, productId }
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        const updatedCart = await getOrCreateCart(userId);
        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/carts/remove
// @access  Private (User must be authenticated)
exports.removeCartItem = async (req, res) => {
    const { userId, productId } = req.body; // ใช้ req.body สำหรับ DELETE ที่มี body
    try {
        // if (req.user && req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Forbidden: You can only remove from your own cart' });
        // }

        const cart = await getOrCreateCart(userId);
        const deletedCount = await CartItem.destroy({
            where: { cartId: cart.id, productId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        const updatedCart = await getOrCreateCart(userId);
        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Clear user's cart
// @route   DELETE /api/carts/clear/:userId
// @access  Private (User must be authenticated)
exports.clearCart = async (req, res) => {
    try {
        const { userId } = req.params;
        // if (req.user && req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Forbidden: You can only clear your own cart' });
        // }

        const cart = await Cart.findOne({ where: { userId } });

        if (!cart) {
            return res.status(200).json({ message: 'Cart already empty or not found', items: [] });
        }

        await CartItem.destroy({ where: { cartId: cart.id } }); // ลบ CartItem ทั้งหมดในตะกร้านี้

        const updatedCart = await getOrCreateCart(userId); // ดึงตะกร้าเปล่ากลับไป
        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};