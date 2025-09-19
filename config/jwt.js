// src/config/jwt.js
require('dotenv').config(); // โหลด environment variables

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
    process.exit(1); // ออกจากการทำงานหากไม่มี JWT_SECRET
}

module.exports = jwtSecret;