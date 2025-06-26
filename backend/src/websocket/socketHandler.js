const { verifyToken } = require('../utils/auth');

module.exports = (io) => {
  // 在线用户映射
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('新用户连接:', socket.id);

    // 用户认证
    socket.on('authenticate', async (token) => {
      try {
        const user = await verifyToken(token);
        if (user) {
          socket.userId = user.id;
          onlineUsers.set(user.id, socket.id);
          socket.emit('authenticated', { success: true });
          
          // 广播在线用户数量
          io.emit('onlineUsers', onlineUsers.size);
        }
      } catch (error) {
        socket.emit('authenticated', { success: false, error: '认证失败' });
      }
    });

    // 聊天消息处理
    socket.on('chatMessage', async (data) => {
      try {
        const { message, roomId } = data;
        if (!socket.userId) {
          socket.emit('error', { message: '请先登录' });
          return;
        }

        // 广播消息到房间
        io.to(roomId).emit('newMessage', {
          userId: socket.userId,
          message,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    // 股票喊单处理
    socket.on('tradingCall', async (data) => {
      try {
        const { stockCode, action, price, reason } = data;
        if (!socket.userId) {
          socket.emit('error', { message: '未授权的操作' });
          return;
        }

        // 广播股票喊单信息
        io.emit('newTradingCall', {
          userId: socket.userId,
          stockCode,
          action,
          price,
          reason,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: '发送喊单失败' });
      }
    });

    // 加入直播间
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      io.to(roomId).emit('userJoined', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // 离开直播间
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit('userLeft', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // 断开连接处理
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('onlineUsers', onlineUsers.size);
      }
      console.log('用户断开连接:', socket.id);
    });
  });
};
