// src/config/db.js
require('dotenv').config(); // โหลด environment variables จาก .env

const mysql = require('mysql2/promise'); // ใช้ promise-based API เพื่อให้ทำงานกับ async/await ได้ง่าย

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ทดสอบการเชื่อมต่อเมื่อ Pool ถูกสร้างขึ้น
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database: Thehellgrocery');
        connection.release(); // คืน connection กลับไปที่ pool
    })
    .catch(err => {
        console.error('Error connecting to MySQL database:', err.message);
        process.exit(1); // ออกจากการทำงานของ Node.js หากเชื่อมต่อฐานข้อมูลไม่ได้
    });

module.exports = pool;