const { ContactMessage } = require('../models');

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Private
exports.createMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { username: name, email } = req.user; // Get from authenticated user

        if (!message) {
            return res.status(400).json({ message: 'Please provide a message.' });
        }

        const newMessage = await ContactMessage.create({ name, email, message });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully!',
            data: newMessage
        });
    } catch (error) {
        console.error('Error creating contact message:', error);
        res.status(500).json({ message: 'Server error while sending message.' });
    }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Public (or Admin in a real-world scenario)
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Server error while fetching messages.' });
    }
}; 