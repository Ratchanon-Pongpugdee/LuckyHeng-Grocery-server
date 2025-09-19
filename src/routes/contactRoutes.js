const express = require('express');
const router = express.Router();
const { createMessage, getAllMessages } = require('../controllers/contactController');
const { authenticate } = require('../middleware/authMiddleware');

// Route to get all messages
router.get('/', getAllMessages);

// Route to create a new message (requires login)
router.post('/', authenticate, createMessage);

module.exports = router; 