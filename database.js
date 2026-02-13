const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Initialize Database Schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        level TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        description TEXT
    )`, (err) => {
        if (err) {
            console.error("Error creating products table:", err.message);
        } else {
            console.log("Products table ready.");

            // Seed Database
            db.get("SELECT count(*) as count FROM products", (err, row) => {
                if (err) {
                    console.error("Error checking products count:", err.message);
                    return;
                }
                if (row.count === 0) {
                    console.log("Seeding products...");
                    const products = [
                        { name: "Laptop Gamer", code: "LPT-001", price: 1200.00, description: "High-performance laptop for gaming and work." },
                        { name: "Smartphone 5G", code: "PHN-002", price: 800.00, description: "Latest generation smartphone with 5G connectivity." },
                        { name: "Monitor 4K", code: "MON-003", price: 350.00, description: "Ultra HD 27-inch monitor." },
                        { name: "Teclado Mecánico", code: "KB-004", price: 120.00, description: "RGB Mechanical Keyboard with Blue switches." },
                        { name: "Mouse Inalámbrico", code: "MS-005", price: 45.00, description: "Ergonomic wireless mouse." },
                        { name: "Auriculares Noise-Cancel", code: "HD-006", price: 150.00, description: "Over-ear headphones with active noise cancellation." },
                        { name: "Tablet Pro", code: "TBL-007", price: 600.00, description: "11-inch tablet for creatives." },
                        { name: "Smartwatch Series 7", code: "WCH-008", price: 250.00, description: "Latest smartwatch with health tracking." }
                    ];

                    const insert = "INSERT INTO products (name, code, price, description) VALUES (?, ?, ?, ?)";
                    products.forEach((prod) => {
                        db.run(insert, [prod.name, prod.code, prod.price, prod.description], (err) => {
                            if (err) console.error("Error inserting product:", prod.name, err.message);
                        });
                    });
                    console.log("Database seeded with technology products.");
                }
            });
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total REAL,
        date TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price REAL
    )`);
});

module.exports = db;
