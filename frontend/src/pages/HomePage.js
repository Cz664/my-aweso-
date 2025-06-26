import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  PlayArrow,
  People,
  Search,
  TrendingUp,
  FiberManualRecord,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const HomePage = () => {
  const [liveRooms, setLiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveRooms();
  }, []);

  const fetchLiveRooms = async () => {
    try {
      const response = await axios.get('/api/stream');
      setLiveRooms(response.data.rooms);
    } catch (error) {
      console.error('获取直播间列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = liveRooms.filter(room =>
    room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.streamer.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const liveRoomsCount = liveRooms.filter(room => room.status === 'live').length;

  const handleRoomClick = (roomId) => {
    navigate(`/room/${roomId}`);
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面头部 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          股票直播间
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          实时股票分析，专业投资建议
        </Typography>
        
        {/* 统计信息 */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiberManualRecord color="error" />
            <Typography variant="body2">
              {liveRoomsCount} 个直播间正在直播
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People color="primary" />
            <Typography variant="body2">
              {liveRooms.reduce((total, room) => total + room.viewers, 0)} 人在线观看
            </Typography>
          </Box>
        </Box>

        {/* 搜索框 */}
        <TextField
          fullWidth
          placeholder="搜索直播间或主播..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* 直播间列表 */}
      <Grid container spacing={3}>
        {loading ? (
          // 加载状态
          Array.from(new Array(6)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Box sx={{ height: 200, bgcolor: 'grey.200' }} />
                <CardContent>
                  <Box sx={{ height: 80, bgcolor: 'grey.100' }} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : filteredRooms.length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'text.secondary',
              }}
            >
              <TrendingUp sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {searchTerm ? '没有找到匹配的直播间' : '暂无直播间'}
              </Typography>
              <Typography variant="body2">
                {searchTerm ? '请尝试其他搜索关键词' : '请稍后再来查看'}
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredRooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleRoomClick(room._id)}
              >
                {/* 缩略图 */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: room.thumbnail ? `url(${room.thumbnail})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!room.thumbnail && (
                      <PlayArrow sx={{ fontSize: 48, color: 'grey.500' }} />
                    )}
                  </CardMedia>
                  
                  {/* 状态标签 */}
                  <Chip
                    label={getStatusText(room.status)}
                    color={getStatusColor(room.status)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    }}
                  />
                  
                  {/* 观看人数 */}
                  {room.status === 'live' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <People sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {room.viewers}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <CardContent>
                  {/* 标题 */}
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {room.title}
                  </Typography>

                  {/* 主播信息 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar
                      src={room.streamer.avatar}
                      sx={{ width: 24, height: 24 }}
                    >
                      {room.streamer.username[0]}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {room.streamer.username}
                    </Typography>
                  </Box>

                  {/* 描述 */}
                  {room.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 1,
                      }}
                    >
                      {room.description}
                    </Typography>
                  )}

                  {/* 标签 */}
                  {room.tags && room.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {room.tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}

                  {/* 时间信息 */}
                  <Typography variant="caption" color="text.secondary">
                    {room.status === 'live' && room.startTime
                      ? `开播于 ${moment(room.startTime).format('HH:mm')}`
                      : `创建于 ${moment(room.createdAt).format('MM-DD HH:mm')}`
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default HomePage;
