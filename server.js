const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database'); // Import SQLite connection

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super_secret_key_change_this_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware for Token Verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: "No token provided." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token." });
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', (req, res) => {
    const { name, email, password, level } = req.body;

    if (!name || !email || !password || !level) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const checkSql = "SELECT email FROM users WHERE email = ?";

    db.get(checkSql, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error." });
        }
        if (row) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertSql = "INSERT INTO users (name, email, password, level) VALUES (?, ?, ?, ?)";

        db.run(insertSql, [name, email, hashedPassword, level], function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: 'User registered successfully!' });
        });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error." });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, level: user.level, name: user.name },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        console.log('>>> Token generado para ' + user.email + ':', token); // LOG REQUESTED BY USER

        res.json({
            success: true,
            token,
            user: {
                name: user.name,
                email: user.email,
                level: user.level
            }
        });
    });
});

// --- Product Routes ---

// Get All Products (Authenticated)
app.get('/api/products', authenticateToken, (req, res) => {
    const sql = "SELECT * FROM products";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error.", error: err.message });
        }
        res.json({ success: true, products: rows });
    });
});

// Get Product by Code (Authenticated)
app.get('/api/products/:code', authenticateToken, (req, res) => {
    const code = req.params.code;
    const sql = "SELECT * FROM products WHERE code = ?";
    db.get(sql, [code], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error." });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, product: row });
    });
});

// Create Product (Admin Only)
app.post('/api/products', authenticateToken, (req, res) => {
    if (req.user.level !== 'admin') {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const { name, code, price, description } = req.body;

    if (!name || !code || !price) {
        return res.status(400).json({ success: false, message: "Name, code, and price are required." });
    }

    const sql = "INSERT INTO products (name, code, price, description) VALUES (?, ?, ?, ?)";
    db.run(sql, [name, code, price, description], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(409).json({ success: false, message: "Product code already exists." });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Product created successfully!", id: this.lastID });
    });
});

// Update Product (Admin Only)
app.put('/api/products/:id', authenticateToken, (req, res) => {
    if (req.user.level !== 'admin') {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const { name, code, price, description } = req.body;

    if (!name || !code || !price) {
        return res.status(400).json({ success: false, message: "Name, code, and price are required." });
    }

    const sql = "UPDATE products SET name = ?, code = ?, price = ?, description = ? WHERE id = ?";
    db.run(sql, [name, code, price, description, id], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(409).json({ success: false, message: "Product code already exists." });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Product updated successfully!" });
    });
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', authenticateToken, (req, res) => {
    if (req.user.level !== 'admin') {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const sql = "DELETE FROM products WHERE id = ?";
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Product deleted successfully!" });
    });
});

// --- Cart Routes ---

// Add Item to Cart
app.post('/api/cart', authenticateToken, (req, res) => {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    if (!product_id || !quantity) {
        return res.status(400).json({ success: false, message: "Product ID and quantity required." });
    }

    // Check if item exists in cart
    db.get("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?", [user_id, product_id], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: "Database error." });

        if (row) {
            // Update quantity
            const newQuantity = row.quantity + quantity;
            db.run("UPDATE cart_items SET quantity = ? WHERE id = ?", [newQuantity, row.id], (err) => {
                if (err) return res.status(500).json({ success: false, message: "Error updating cart." });
                res.json({ success: true, message: "Cart updated." });
            });
        } else {
            // Insert new item
            db.run("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", [user_id, product_id, quantity], (err) => {
                if (err) return res.status(500).json({ success: false, message: "Error adding to cart." });
                res.json({ success: true, message: "Item added to cart." });
            });
        }
    });
});

// Get Cart Items
app.get('/api/cart', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const sql = `
        SELECT ci.id, ci.quantity, p.name, p.price, p.code 
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `;
    db.all(sql, [user_id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error." });
        res.json({ success: true, cart: rows });
    });
});

// Clear Cart
app.delete('/api/cart', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    db.run("DELETE FROM cart_items WHERE user_id = ?", [user_id], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Error clearing cart." });
        res.json({ success: true, message: "Cart cleared." });
    });
});

// --- Order Routes ---

// Checkout (Create Order)
app.post('/api/orders', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const date = new Date().toISOString();

    // 1. Get Cart Items
    const sqlCart = `
        SELECT ci.product_id, ci.quantity, p.price 
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `;

    db.all(sqlCart, [user_id], (err, cartItems) => {
        if (err) return res.status(500).json({ success: false, message: "Error fetching cart." });
        if (cartItems.length === 0) return res.status(400).json({ success: false, message: "Cart is empty." });

        // 2. Calculate Total
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3. Create Order
        db.run("INSERT INTO orders (user_id, total, date) VALUES (?, ?, ?)", [user_id, total, date], function (err) {
            if (err) return res.status(500).json({ success: false, message: "Error creating order." });
            const order_id = this.lastID;

            // 4. Insert Order Items
            const placeholders = cartItems.map(() => "(?, ?, ?, ?)").join(", ");
            const values = [];
            cartItems.forEach(item => {
                values.push(order_id, item.product_id, item.quantity, item.price);
            });

            const sqlOrderItems = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES " + placeholders;
            db.run(sqlOrderItems, values, (err) => {
                if (err) return res.status(500).json({ success: false, message: "Error saving order items." });

                // 5. Clear Cart
                db.run("DELETE FROM cart_items WHERE user_id = ?", [user_id], (err) => {
                    if (err) console.error("Error clearing cart after order:", err);
                    res.json({ success: true, message: "Order placed successfully!", orderId: order_id });
                });
            });
        });
    });
});

// Get Order History
app.get('/api/orders', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const sql = "SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC";
    db.all(sql, [user_id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error." });
        res.json({ success: true, orders: rows });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
