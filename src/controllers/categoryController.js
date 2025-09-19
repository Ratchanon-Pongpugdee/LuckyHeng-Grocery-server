// thehellgrocery-backend/src/controllers/categoryController.js
const { Category } = require('../models');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']], // Order by name
        });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error fetching categories.' });
    }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    try {
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
        }

        const category = await Category.create({ name, description });
        res.status(201).json({ success: true, message: 'Category created successfully.', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error creating category.' });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        // Check for duplicate name if name is changed
        if (name !== category.name) {
            const existingCategory = await Category.findOne({ where: { name } });
            if (existingCategory && existingCategory.id !== id) {
                return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
            }
        }

        category.name = name;
        category.description = description || null;
        await category.save();

        res.status(200).json({ success: true, message: 'Category updated successfully.', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error updating category.' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        // IMPORTANT: When a category is deleted, products associated with it will have their categoryId set to NULL
        // If you want a different behavior (e.g., prevent deletion if products exist, or reassign to 'Uncategorized'),
        // you'd add more logic here. 'SET NULL' is configured in the model association.

        await category.destroy();
        res.status(200).json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error deleting category.' });
    }
};