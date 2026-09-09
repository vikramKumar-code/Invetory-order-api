const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create a new order (Logged-in user)
// @route   POST /api/orders or POST /orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        let { products, product, quantity } = req.body;

        // Support single item order payload { product: id, quantity: 2 }
        if (!products && product) {
            products = [{ product, quantity: quantity || 1 }];
        }

        // Validate products array
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one product in the order',
            });
        }

        let calculatedTotal = 0;
        const verifiedOrderItems = [];
        const productsToUpdate = [];

        // Validate each item and check inventory stock
        for (const item of products) {
            let productId = item.product || item.productId || item._id || item.id;
            if (typeof productId === 'string') {
                productId = productId.trim();
            }
            const itemQty = Number(item.quantity) || 1;

            if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid product ID: ${productId}`,
                });
            }

            if (itemQty <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be at least 1',
                });
            }

            const productDoc = await Product.findById(productId);
            if (!productDoc) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${productId} not found`,
                });
            }

            // Check if sufficient stock is available
            if (productDoc.stockQuantity < itemQty) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product "${productDoc.name}". Available: ${productDoc.stockQuantity}, Requested: ${itemQty}`,
                });
            }

            const itemPrice = Number(productDoc.price);
            calculatedTotal += itemPrice * itemQty;

            verifiedOrderItems.push({
                product: productDoc._id,
                quantity: itemQty,
                price: itemPrice,
            });

            productsToUpdate.push({
                doc: productDoc,
                qtyToDeduct: itemQty,
            });
        }

        // Deduct inventory stock for each verified product
        for (const { doc, qtyToDeduct } of productsToUpdate) {
            doc.stockQuantity -= qtyToDeduct;
            await doc.save();
        }

        // Create the order
        const order = await Order.create({
            user: req.user.id,
            products: verifiedOrderItems,
            totalAmount: Number(req.body.totalAmount) || calculatedTotal,
            orderStatus: 'pending',
        });

        // Populate product and user details for response
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('products.product', 'name price category');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: populatedOrder,
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
            message: error.message || 'Server error creating order',
        });
    }
};

// @desc    Get all orders of the logged-in user
// @route   GET /api/orders or GET /orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('products.product', 'name price category')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching orders',
        });
    }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id or GET /orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }

        const order = await Order.findById(id)
            .populate('user', 'name email')
            .populate('products.product', 'name price category');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Verify that the logged-in user owns this order
        if (order.user._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order',
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching order',
        });
    }
};

// @desc    Update order status / Cancel order
// @route   PATCH /api/orders/:id
// @access  Private
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, orderStatus } = req.body;

        const newStatus = status || orderStatus;

        if (!newStatus) {
            return res.status(400).json({
                success: false,
                message: 'Please provide status or orderStatus',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Verify ownership
        if (order.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order',
            });
        }

        // If cancelling order, restore inventory stock
        if (newStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
            for (const item of order.products) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stockQuantity: item.quantity },
                });
            }
        }

        order.orderStatus = newStatus;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating order status',
        });
    }
};

exports.getOrders = exports.getMyOrders;

