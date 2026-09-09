# Inventory & Order Management API

A RESTful API built with **Node.js**, **Express**, and **MongoDB (Mongoose)** for managing products, user authentication, and inventory-backed orders.

---

## Features

- **Authentication & Security**: User registration, login, and JWT-protected routes (`bcryptjs`, `jsonwebtoken`, `helmet`, `cors`).
- **Product Management**: Complete CRUD operations with search, category filtering, and pagination.
- **Order Processing**: Inventory-aware order creation that checks product availability and automatically deducts stock upon purchase.
- **Error Handling**: Operational error handling via `AppError`, `catchAsync` wrapper, and centralized Express error-handling middleware.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Logging & Security**: Helmet, Morgan, CORS

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection URI

### 2. Installation
```bash
git clone https://github.com/vikramKumar-code/Invetory-order-api
cd invetory-order-api
npm install
```

### 3. Environment Variables
A pre-configured template is provided in [`.env.example`](.env.example). Create your local `.env` file by copying the example:
```bash
cp .env.example .env
```

Template contents in `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/inventory_order_db
JWT_SECRET=supersecret_jwt_key_for_dev_12345
JWT_EXPIRE=1d
```

### 4. Run the Server
- **Development mode (with nodemon):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

---

## API Endpoints

### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Log in user and receive JWT token |
| `GET` | `/auth/me` | Private | Get authenticated user profile |

### Products (`/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/products` | Public | Create a new product |
| `GET` | `/products` | Public | Get all products (supports `search`, `category`, `page`, `limit`) |
| `GET` | `/products/:id` | Public | Get product details by ID |
| `PATCH` | `/products/:id` | Public | Update a product by ID |
| `DELETE` | `/products/:id` | Public | Delete a product by ID |

### Orders (`/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Private | Create an order (verifies & deducts inventory stock) |
| `GET` | `/orders` | Private | Get all orders of the logged-in user |
| `GET` | `/orders/:id` | Private | Get a single order by ID |

---

## Postman Collection

All endpoints (Authentication, Products, and Orders) are ready for testing via Postman:

🔗 **[View & Fork Postman Collection](https://vk8595422784-62024.postman.co/workspace/Game-Play-Station~1e748752-3704-413e-badb-01fe11b638d2/collection/51661528-043db042-07f2-4204-bb23-9628711b2d1a?action=share&source=copy-link&creator=51661528)**

### Postman Testing Guide:
1. Open the link above and view/fork the collection into your workspace.
2. Set `baseUrl` to `http://localhost:5000`.
3. First, call `POST /auth/login` (or `POST /auth/register`) to receive your JWT token.
4. Pass the token as `Bearer <token>` under the **Authorization** tab for protected endpoints (`/auth/me` and `/orders`).

---

## Concurrency & Race Conditions Question

### Question:
> *Imagine two users try to buy the last available item at the same time. How would you make sure the stock does not become negative or both orders get confirmed?*

### Answer:
To prevent race conditions without complex distributed locking:

1. **Atomic Conditional Updates**:
   Instead of fetching the product in memory first and updating it later, use MongoDB's atomic `findOneAndUpdate` with a query condition checking stock availability:
   ```javascript
   const updatedProduct = await Product.findOneAndUpdate(
       { _id: productId, stockQuantity: { $gte: requestedQty } },
       { $inc: { stockQuantity: -requestedQty } },
       { new: true }
   );
   ```
   - If `updatedProduct` is `null`, it means the stock was already claimed by the other concurrent request. We immediately return a `400 Bad Request` ("Insufficient stock").
   - Because MongoDB executes document updates atomically, only one request will successfully match the condition and deduct the stock; the second request will fail safely.

2. **Database Transactions (for multi-item orders)**:
   For orders with multiple items, wrap the atomic updates inside a **MongoDB multi-document transaction** (`session.startTransaction()`). If any item lacks sufficient stock, abort the entire transaction so no stock is deducted.

---

## AI Usage

In compliance with the assignment guidelines:

- **AI Tools Used**:
  - **Antigravity IDE** powered by **Gemini 3.8 Flash**
- **What they were used for**:
  - Scaffolding the Express application structure and initial configuration.
  - Designing Mongoose schemas with validation and virtual fields (`User`, `Product`, `Order`).
  - Implementing controller CRUD operations, inventory deduction logic, and JWT authentication middleware.
  - Refactoring error handling with `AppError` and `catchAsync` utility patterns.
  - Generating cURL testing requests for API verification.
- **My Own Work**:
  - Defining requirements, reviewing the code, testing it (ran the build to confirm everything works correctly), and organizing the commits to reflect a clear development process.
