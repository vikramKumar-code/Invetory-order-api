const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

// Route: /products
router.route('/')
    .get(getProducts)
    .post(createProduct);

// Route: /products/:id
router.route('/:id')
    .get(getProductById)
    .patch(updateProduct)
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;
