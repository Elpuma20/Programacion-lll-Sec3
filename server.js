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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
