// src/routes/authRoutes.js
const express = require('express');
const router = express.Router(); // สร้าง router instance
const authController = require('../controllers/authController'); // ดึง controller functions

// Route สำหรับลงทะเบียนผู้ใช้
router.post('/register', authController.register);

// Route สำหรับเข้าสู่ระบบ
router.post('/login', authController.login);

// Social login
router.post('/google', authController.googleLogin);

// Refresh token
router.post('/refresh', authController.refresh);

module.exports = router;