// thehellgrocery-backend/src/controllers/productController.js
const { Product, Category, OrderItem, CartItem, Review, sequelize } = require('../models');
// ฟังก์ชัน normalize imageUrl ให้เป็นลิงก์เต็มเสมอ
function normalizeImageUrl(imageUrl, req) {
    if (!imageUrl) return '';
    // ถ้าเป็นลิงก์ภายนอก (http/https) ให้ใช้ตามนั้น
    if (/^https?:\/\//.test(imageUrl)) return imageUrl;
    // ถ้าเป็น path uploads ให้เติม baseUrl
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    if (imageUrl.startsWith('/uploads/')) return `${baseUrl}${imageUrl}`;
    return imageUrl;
}
const { Op } = require('sequelize'); // Import Op สำหรับ operator ใน Sequelize

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, limit, categoryId } = req.query; // ดึง query parameters

        const whereClause = {}; // Object สำหรับเก็บเงื่อนไขการค้นหา

        // 1. Search by name (case-insensitive)
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%` // ใช้ Op.like สำหรับ MySQL
            };
        }

        // 2. Filter by category (ถ้าเรามี field category ใน Product model)
        if (category) {
            whereClause.category = category; // ต้องแน่ใจว่า field category ใน Product model ตรงกัน
        }

        // Filter by categoryId (ใหม่)
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        // 3. Filter by price range
        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) {
                whereClause.price[Op.gte] = parseFloat(minPrice); // Greater than or equal to
            }
            if (maxPrice) {
                whereClause.price[Op.lte] = parseFloat(maxPrice); // Less than or equal to
            }
        }

        // 4. Limit for featured products on homepage (ที่เราใช้ไปแล้ว)
        const findOptions = {
            where: whereClause,
            order: [['createdAt', 'DESC']] // เรียงลำดับจากใหม่ไปเก่า
        };

        if (limit) {
            findOptions.limit = parseInt(limit);
        }

        // เพิ่ม include Category
        findOptions.include = [{ model: Category, as: 'Category', attributes: ['id', 'name'] }];

        const products = await Product.findAll(findOptions);
        // normalize imageUrl ทุกตัว
        const normalizedProducts = products.map(product => {
            const p = product.toJSON();
            p.imageUrl = normalizeImageUrl(p.imageUrl, req);
            return p;
        });
        res.status(200).json({ products: normalizedProducts });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
    // normalize imageUrl
    const p = product.toJSON();
    p.imageUrl = normalizeImageUrl(p.imageUrl, req);
    res.status(200).json({ product: p });
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, imageUrl, categoryId } = req.body;
        if (!name || !price) {
            return res.status(400).json({ message: 'Name and price are required.' });
        }

        // Determine final image URL
        let finalImageUrl = imageUrl;
        if (req.file) {
            // Build URL to serve the uploaded image via /uploads
            // Uploaded to server/src/uploads/products -> served at /uploads/products
            const relativePath = `/uploads/products/${req.file.filename}`;
            finalImageUrl = relativePath; // Use relative path directly
        }
        const product = await Product.create({
            name,
            description,
            price,
            stock: stock || 0,
            imageUrl: finalImageUrl,
            categoryId
        });
    // normalize imageUrl ก่อนส่งกลับ
    const p = product.toJSON();
    p.imageUrl = normalizeImageUrl(p.imageUrl, req);
    res.status(201).json({ product: p });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, imageUrl, categoryId } = req.body;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // อัปเดตข้อมูล โดยไม่อัปเดตเป็นค่าว่าง/null ถ้าไม่ได้ส่งค่าจริง
        if (name !== undefined && name !== '') product.name = name;
        if (description !== undefined && description !== '') product.description = description;
        if (price !== undefined && price !== '') product.price = price;
        if (stock !== undefined && stock !== '') product.stock = stock;
        if (req.file) {
            const relativePath = `/uploads/products/${req.file.filename}`;
            product.imageUrl = relativePath; // Use relative path directly
        } else if (imageUrl !== undefined && imageUrl !== '') {
            product.imageUrl = imageUrl;
        }
        if (categoryId !== undefined && categoryId !== '') product.categoryId = categoryId;
        await product.save();
    // normalize imageUrl ก่อนส่งกลับ
    const p = product.toJSON();
    p.imageUrl = normalizeImageUrl(p.imageUrl, req);
    res.status(200).json({ product: p });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, { transaction: t });
        if (!product) {
            await t.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        // ลบความสัมพันธ์ที่อาจค้างอยู่ก่อน เช่น cart items, order items, reviews
        await CartItem.destroy({ where: { productId: id }, transaction: t });
        await OrderItem.destroy({ where: { productId: id }, transaction: t });
        await Review.destroy({ where: { productId: id }, transaction: t });

        await product.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all product categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        // ดึง category ทั้งหมดที่ไม่ซ้ำจาก Product
        const categories = await Product.findAll({
            attributes: [
                [Product.sequelize.fn('DISTINCT', Product.sequelize.col('category')), 'category']
            ],
            where: {
                category: { [Op.ne]: null }
            }
        });
        // แปลงเป็น array ของ string
        const categoryList = categories.map(c => c.category || c.get('category')).filter(Boolean);
        res.status(200).json({ categories: categoryList });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Stock Report
// @route   GET /api/products/stock-report
// @access  Private/Admin
exports.getStockReport = async (req, res) => {
    try {
        const { categoryId } = req.query;
        if (!categoryId) {
            // ถ้าไม่ได้เลือกหมวดหมู่ return []
            return res.status(200).json([]);
        }
        const products = await Product.findAll({
            attributes: ['id', 'name', 'stock', 'price', 'imageUrl'],
            where: { categoryId },
            include: [{ model: Category, as: 'Category', attributes: ['name'] }],
            order: [['name', 'ASC']]
        });
        // กำหนดสถานะตาม stock
        const result = products.map(product => {
            let status = 'normal';
            if (product.stock > 50) status = 'beyond';
            else if (product.stock >= 31) status = 'high';
            else if (product.stock >= 6) status = 'normal';
            else if (product.stock >= 1) status = 'low';
            else status = 'out';
            return {
                id: product.id,
                name: product.name,
                stock: product.stock,
                price: product.price,
                imageUrl: normalizeImageUrl(product.imageUrl, req),
                category: product.Category ? product.Category.name : '-',
                status
            };
        });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching stock report:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};