const mongoose = require('mongoose');
const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /products or POST /api/products
// @access  Public / Private
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stockQuantity, stock, category } = req.body;

        // Support both stockQuantity and stock input
        const quantity = stockQuantity !== undefined ? stockQuantity : stock;

        // Basic validation
        if (!name || price === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, price, and category',
            });
        }

        const product = await Product.create({
            name,
            description,
            price: Number(price),
            stockQuantity: quantity !== undefined ? Number(quantity) : 0,
            category,
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating product',
        });
    }
};

// @desc    Get all products (with optional search, category filter, and pagination)
// @route   GET /products or GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, inStock, page, limit } = req.query;

        // Build filter object
        const filter = {};

        // Search by name (case-insensitive regex)
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        // Filter by category
        if (category) {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        // Filter by price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
        }

        // Filter by stock availability
        if (inStock === 'true') {
            filter.stockQuantity = { $gt: 0 };
        }

        let query = Product.find(filter).sort({ createdAt: -1 });

        // If pagination parameters are provided, apply pagination
        if (page !== undefined || limit !== undefined) {
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, parseInt(limit, 10) || 10);
            const skip = (pageNum - 1) * limitNum;

            const total = await Product.countDocuments(filter);
            const products = await query.skip(skip).limit(limitNum);

            return res.status(200).json({
                success: true,
                count: products.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                products,
            });
        }

        // If no pagination requested, return all matching products
        const products = await query;

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching products',
        });
    }
};

// @desc    Get single product by ID
// @route   GET /products/:id or GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching product',
        });
    }
};

// @desc    Update a product by ID
// @route   PATCH /products/:id or PUT /products/:id
// @access  Public / Private
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const updateData = { ...req.body };

        // Support both stock and stockQuantity in update
        if (updateData.stock !== undefined && updateData.stockQuantity === undefined) {
            updateData.stockQuantity = updateData.stock;
            delete updateData.stock;
        }

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }

        if (updateData.stockQuantity !== undefined) {
            updateData.stockQuantity = Number(updateData.stockQuantity);
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating product',
        });
    }
};

// @desc    Delete a product by ID
// @route   DELETE /products/:id
// @access  Public / Private
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error deleting product',
        });
    }
};
