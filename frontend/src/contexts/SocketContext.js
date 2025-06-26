import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      // 创建socket连接
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
        auth: {
          token: token
        }
      });

      // 连接事件
      newSocket.on('connect', () => {
        console.log('Socket连接成功');
        setConnected(true);
        
        // 发送认证信息
        if (token) {
          newSocket.emit('authenticate', token);
        }
      });

      // 断开连接事件
      newSocket.on('disconnect', () => {
        console.log('Socket连接断开');
        setConnected(false);
      });

      // 认证结果
      newSocket.on('authenticated', (data) => {
        if (data.success) {
          console.log('Socket认证成功');
        } else {
          console.error('Socket认证失败:', data.error);
        }
      });

      // 在线用户数量更新
      newSocket.on('onlineUsers', (count) => {
        setOnlineUsers(count);
      });

      // 错误处理
      newSocket.on('error', (error) => {
        console.error('Socket错误:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  // 加入直播间
  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('joinRoom', roomId);
    }
  };

  // 离开直播间
  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leaveRoom', roomId);
    }
  };

  // 发送聊天消息
  const sendMessage = (roomId, message) => {
    if (socket && connected) {
      socket.emit('chatMessage', {
        roomId,
        message
      });
    }
  };

  // 发送股票喊单
  const sendTradingCall = (tradingCallData) => {
    if (socket && connected) {
      socket.emit('tradingCall', tradingCallData);
    }
  };

  // 监听新消息
  const onNewMessage = (callback) => {
    if (socket) {
      socket.on('newMessage', callback);
      return () => socket.off('newMessage', callback);
    }
  };

  // 监听新喊单
  const onNewTradingCall = (callback) => {
    if (socket) {
      socket.on('newTradingCall', callback);
      return () => socket.off('newTradingCall', callback);
    }
  };

  // 监听用户加入
  const onUserJoined = (callback) => {
    if (socket) {
      socket.on('userJoined', callback);
      return () => socket.off('userJoined', callback);
    }
  };

  // 监听用户离开
  const onUserLeft = (callback) => {
    if (socket) {
      socket.on('userLeft', callback);
      return () => socket.off('userLeft', callback);
    }
  };

  // 移除事件监听器
  const removeListener = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTradingCall,
    onNewMessage,
    onNewTradingCall,
    onUserJoined,
    onUserLeft,
    removeListener,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
