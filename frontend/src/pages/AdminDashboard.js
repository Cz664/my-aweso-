import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  People,
  TrendingUp,
  Chat,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const AdminDashboard = () => {
  const { user, isAdmin, isStreamer } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [tradingCalls, setTradingCalls] = useState([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    liveRooms: 0,
    totalViewers: 0,
    totalTradingCalls: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    title: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (!isStreamer) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isStreamer, navigate]);

  const fetchData = async () => {
    try {
      const [roomsResponse, tradingCallsResponse] = await Promise.all([
        axios.get('/api/stream'),
        axios.get('/api/trading/room/all'), // 需要创建这个端点
      ]);

      setRooms(roomsResponse.data.rooms);
      setTradingCalls(tradingCallsResponse.data.tradingCalls || []);

      // 计算统计数据
      const totalRooms = roomsResponse.data.rooms.length;
      const liveRooms = roomsResponse.data.rooms.filter(room => room.status === 'live').length;
      const totalViewers = roomsResponse.data.rooms.reduce((sum, room) => sum + room.viewers, 0);

      setStats({
        totalRooms,
        liveRooms,
        totalViewers,
        totalTradingCalls: tradingCallsResponse.data.tradingCalls?.length || 0,
      });
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post('/api/stream', {
        title: roomForm.title,
        description: roomForm.description,
        tags: roomForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      });

      if (response.data) {
        setOpenDialog(false);
        setRoomForm({ title: '', description: '', tags: '' });
        fetchData();
      }
    } catch (error) {
      console.error('创建直播间失败:', error);
    }
  };

  const handleStartStream = async (roomId) => {
    try {
      await axios.post(`/api/stream/${roomId}/start`);
      fetchData();
    } catch (error) {
      console.error('开始直播失败:', error);
    }
  };

  const handleStopStream = async (roomId) => {
    try {
      await axios.post(`/api/stream/${roomId}/end`);
      fetchData();
    } catch (error) {
      console.error('结束直播失败:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'error';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live':
        return '直播中';
      case 'scheduled':
        return '预约中';
      default:
        return '离线';
    }
  };

  if (!isStreamer) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isAdmin ? '管理员仪表板' : '主播控制台'}
      </Typography>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    总直播间
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalRooms}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    正在直播
                  </Typography>
                  <Typography variant="h4">
                    {stats.liveRooms}
                  </Typography>
                </Box>
                <PlayArrow color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    总观看人数
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalViewers}
                  </Typography>
                </Box>
                <Visibility color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    总喊单数
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalTradingCalls}
                  </Typography>
                </Box>
                <TrendingUp color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 标签页 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="直播间管理" />
          <Tab label="喊单管理" />
        </Tabs>
      </Paper>

      {/* 直播间管理 */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">直播间列表</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              创建直播间
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>标题</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>观看人数</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={room.thumbnail} sx={{ width: 32, height: 32 }}>
                          {room.title[0]}
                        </Avatar>
                        {room.title}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(room.status)}
                        color={getStatusColor(room.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{room.viewers}</TableCell>
                    <TableCell>
                      {moment(room.createdAt).format('YYYY-MM-DD HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {room.status === 'live' ? (
                          <IconButton
                            color="error"
                            onClick={() => handleStopStream(room._id)}
                          >
                            <Stop />
                          </IconButton>
                        ) : (
                          <IconButton
                            color="success"
                            onClick={() => handleStartStream(room._id)}
                          >
                            <PlayArrow />
                          </IconButton>
                        )}
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/room/${room._id}`)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton color="default">
                          <Edit />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 喊单管理 */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            最近喊单
          </Typography>
          {/* 这里可以添加喊单列表 */}
          <Typography color="text.secondary">
            喊单管理功能开发中...
          </Typography>
        </Paper>
      )}

      {/* 创建直播间对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>创建新直播间</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="直播间标题"
            value={roomForm.title}
            onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="直播间描述"
            value={roomForm.description}
            onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="标签 (用逗号分隔)"
            value={roomForm.tags}
            onChange={(e) => setRoomForm({ ...roomForm, tags: e.target.value })}
            margin="normal"
            placeholder="股票, 投资, 分析"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleCreateRoom} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
