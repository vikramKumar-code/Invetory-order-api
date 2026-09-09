const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [100, 'Product name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Product price is required'],
            min: [0, 'Price must be greater than or equal to 0'],
        },
        stockQuantity: {
            type: Number,
            required: [true, 'Stock quantity is required'],
            min: [0, 'Stock quantity cannot be negative'],
            default: 0,
            alias: 'stock',
        },
        category: {
            type: String,
            required: [true, 'Product category is required'],
            trim: true,
        },
    },
    {
        timestamps: true, // Automatically provides createdAt (created date) and updatedAt
    }
);

module.exports = mongoose.model('Product', productSchema);
