const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

// ● POST /orders – Create an order
// ● GET /orders – Get logged-in user's orders
router.route('/')
    .post(createOrder)
    .get(getMyOrders);

// ● GET /orders/:id – Get one order
router.route('/:id')
    .get(getOrderById);

module.exports = router;
