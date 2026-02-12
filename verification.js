const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ error: 'Invalid JSON', body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function verify() {
    console.log("--- Starting Verification ---");

    // 1. Register User
    console.log("1. Testing Registration...");
    const regData = {
        name: "Test User",
        email: "test_" + Date.now() + "@example.com",
        password: "password123",
        level: "admin"
    };

    try {
        const regRes = await postRequest('/register', regData);
        console.log("Registration Response:", regRes);

        if (!regRes.success) {
            console.error("FAILED: Registration failed");
            return;
        }
    } catch (err) {
        console.error("FAILED: Could not connect to server", err);
        return;
    }

    // 2. Login User
    console.log("\n2. Testing Login...");
    const loginData = {
        email: regData.email,
        password: "password123"
    };

    try {
        const loginRes = await postRequest('/login', loginData);
        console.log("Login Response:", loginRes);

        if (loginRes.success && loginRes.token) {
            console.log("PASSED: Login successful and token received!");
            console.log("Token:", loginRes.token.substring(0, 20) + "...");
            console.log("User Level:", loginRes.user.level);
        } else {
            console.error("FAILED: Login failed or no token");
        }
    } catch (err) {
        console.error("FAILED: Could not connect to server", err);
    }
}

verify();
