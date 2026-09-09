const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
            default: 1,
        },
        price: {
            type: Number,
            min: [0, 'Price cannot be negative'],
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
        },
        products: {
            type: [orderItemSchema],
            required: [true, 'Order must contain at least one product'],
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: 'Order must contain at least one product',
            },
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Total amount cannot be negative'],
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'cancelled'],
            default: 'pending',
            alias: 'status',
        },
    },
    {
        timestamps: true, // Automatically provides createdAt and updatedAt
    }
);

// Virtual for total quantity of items in the order
orderSchema.virtual('quantity').get(function () {
    if (!this.products || !Array.isArray(this.products)) return 0;
    return this.products.reduce((acc, item) => acc + (item.quantity || 0), 0);
});

// Virtual for createdDate
orderSchema.virtual('createdDate').get(function () {
    return this.createdAt;
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
