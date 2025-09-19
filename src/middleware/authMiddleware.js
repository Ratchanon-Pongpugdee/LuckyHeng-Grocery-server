// thehellgrocery-backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // ต้องมี User Model

// Middleware สำหรับตรวจสอบ Token และยืนยันตัวตน (Authentication)
async function authenticate(req, res, next) {
    let token;

    // ตรวจสอบว่ามี token ใน headers Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // ดึง token ออกมา
            token = req.headers.authorization.split(' ')[1];

            // ถอดรหัส token
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT_SECRET ต้องอยู่ใน .env

            // ค้นหาผู้ใช้จาก ID ที่ถอดรหัสได้ และไม่ส่ง password กลับมา
            req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            return next();
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
}

// Middleware สำหรับตรวจสอบสิทธิ์ (Authorization) ว่าเป็น Admin หรือไม่
function authorizeAdmin(roles = []) {
    return (req, res, next) => {
        // ...ตรวจสอบสิทธิ์...
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Not authorized as an admin' });
        }
        next();
    };
}
module.exports = {
    authenticate,
    authorizeAdmin
};