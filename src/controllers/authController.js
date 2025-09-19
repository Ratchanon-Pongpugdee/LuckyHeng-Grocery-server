// src/controllers/authController.js
const pool = require('../../config/db'); // ดึง connection pool ที่เราสร้างไว้
const bcrypt = require('bcryptjs'); // สำหรับ Hash รหัสผ่าน
const jwt = require('jsonwebtoken'); // สำหรับสร้าง JWT
const JWT_SECRET = require('../../config/jwt'); // ดึง JWT secret key
const { v4: uuidv4 } = require('uuid'); // สำหรับสร้าง UUID
const { User } = require('../models'); // <-- เพิ่ม Sequelize User model
const { v4: uuid } = require('uuid');

// ฟังก์ชันสำหรับลงทะเบียนผู้ใช้ใหม่ (Register)
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields: username, email, and password.' });
    }

    try {
        // 1. ตรวจสอบว่า username หรือ email ซ้ำหรือไม่
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        // 2. Hash รหัสผ่าน
        // อ้างอิง: Salt generation in bcrypt.js is CPU-intensive. A salt with 10 rounds is a good balance for most applications.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate UUID for id
        const id = uuidv4();
        const userRole = (role === 'ADMIN') ? 'ADMIN' : 'USER'; // ให้ตรง ENUM Sequelize
        const now = new Date();

        const [result] = await pool.query(
            'INSERT INTO users (id, username, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, username, email, hashedPassword, userRole, now, now]
        );

        res.status(201).json({ message: 'User registered successfully!', userId: id, role: userRole });

    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// ฟังก์ชันสำหรับเข้าสู่ระบบ (Login) ด้วย Sequelize
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    try {
        // 1. ค้นหาผู้ใช้ด้วย email (Sequelize)
        console.log('Login attempt:', email);
        const user = await User.findOne({ where: { email } });
        console.log('User from DB:', user);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        // 2. เปรียบเทียบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        // 3. สร้าง JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '365d' }
        );
        res.status(200).json({
            message: 'Logged in successfully!',
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage // เพิ่ม profileImage ใน response
            }
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Social Login: Google
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'Missing Google idToken' });
        }

        // Verify token with Google tokeninfo endpoint
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!verifyRes.ok) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }
        const payload = await verifyRes.json();
        const email = payload.email;
        const name = payload.name || email?.split('@')[0] || 'user';
        if (!email) {
            return res.status(400).json({ message: 'Google token missing email' });
        }

        // Find or create user
        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                id: uuid(),
                username: name,
                email,
                password: await bcrypt.hash(uuid(), 10), // random password
                role: 'USER'
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '365d' }
        );

        return res.status(200).json({
            message: 'Logged in with Google successfully!',
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (err) {
        console.error('Error during google login:', err);
        return res.status(500).json({ message: 'Server error during google login.' });
    }
};

// Refresh access token using refresh token
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Missing refreshToken' });
        }
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        // Optional: load user to ensure still valid
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.status(200).json({ token });
    } catch (err) {
        console.error('Error refreshing token:', err);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};