import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Avatar,
  IconButton,
  TextField,
  Button,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Send,
  People,
  ThumbUp,
  Share,
  TrendingUp,
  Chat,
  Close,
} from '@mui/icons-material';
import ReactPlayer from 'react-player';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ChatMessage from '../components/Chat/ChatMessage';
import TradingCallCard from '../components/Trading/TradingCallCard';
import axios from 'axios';

const LiveRoomPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    onNewMessage,
    onNewTradingCall,
  } = useSocket();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tradingCalls, setTradingCalls] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef(null);

  // 获取直播间信息
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const [roomResponse, messagesResponse, tradingCallsResponse] = await Promise.all([
          axios.get(`/api/stream/${roomId}`),
          axios.get(`/api/chat/room/${roomId}`),
          axios.get(`/api/trading/room/${roomId}`),
        ]);

        setRoom(roomResponse.data.room);
        setMessages(messagesResponse.data.messages);
        setTradingCalls(tradingCallsResponse.data.tradingCalls);
      } catch (error) {
        console.error('获取直播间数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  // WebSocket连接管理
  useEffect(() => {
    if (connected && room) {
      joinRoom(roomId);

      // 监听新消息
      const messageHandler = (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      };

      // 监听新喊单
      const tradingCallHandler = (newTradingCall) => {
        setTradingCalls((prev) => [newTradingCall, ...prev]);
      };

      onNewMessage(messageHandler);
      onNewTradingCall(tradingCallHandler);

      return () => {
        leaveRoom(roomId);
      };
    }
  }, [connected, room, roomId]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current && activeTab === 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;

    sendMessage(roomId, messageInput.trim());
    setMessageInput('');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>直播间不存在</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        {/* 左侧直播区域 */}
        <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 视频播放器 */}
            <Box sx={{ width: '100%', pt: '56.25%', position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  bgcolor: 'black',
                }}
              >
                {room.status === 'live' && (
                  <ReactPlayer
                    url={`${process.env.REACT_APP_RTMP_URL}/${room.streamKey}`}
                    playing
                    width="100%"
                    height="100%"
                    controls
                  />
                )}
              </Box>
            </Box>

            {/* 直播信息 */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={room.streamer.avatar}
                  sx={{ width: 48, height: 48, mr: 2 }}
                >
                  {room.streamer.username[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{room.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.streamer.username}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ThumbUp />}
                  >
                    关注
                  </Button>
                  <IconButton>
                    <Share />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2">{room.description}</Typography>
            </Box>
          </Box>
        </Grid>

        {/* 右侧互动区域 */}
        <Grid item xs={12} md={4} lg={3} sx={{ height: '100%', borderLeft: 1, borderColor: 'divider' }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 标签页 */}
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab
                icon={
                  <Badge badgeContent={messages.length} color="primary">
                    <Chat />
                  </Badge>
                }
                label="聊天"
              />
              <Tab
                icon={
                  <Badge badgeContent={tradingCalls.length} color="secondary">
                    <TrendingUp />
                  </Badge>
                }
                label="喊单"
              />
            </Tabs>

            {/* 内容区域 */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {activeTab === 0 ? (
                // 聊天区域
                <Box
                  ref={chatContainerRef}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2,
                    overflow: 'auto',
                  }}
                >
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message._id || index}
                      message={message}
                      isOwnMessage={message.user._id === user?._id}
                    />
                  ))}
                </Box>
              ) : (
                // 喊单区域
                <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                  {tradingCalls.map((call) => (
                    <TradingCallCard key={call._id} tradingCall={call} />
                  ))}
                </Box>
              )}
            </Box>

            {/* 输入区域 */}
            {activeTab === 0 && (
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder={user ? "发送消息..." : "请先登录"}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!user}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        type="submit"
                        disabled={!messageInput.trim() || !user}
                      >
                        <Send />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveRoomPage;
