// server/src/utils/socket.js

function sendNotificationToUser(app, userId, notification) {
    const io = app.get('io');
    const userSocketMap = app.get('userSocketMap');
    const socketId = userSocketMap[userId];
    if (io && socketId) {
        io.to(socketId).emit('new_notification', notification);
    }
}

module.exports = { sendNotificationToUser };