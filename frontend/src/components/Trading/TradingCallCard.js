import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Button,
  Collapse,
  Divider,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  ThumbUp,
  ThumbDown,
  Comment,
  Share,
  Delete,
  Edit,
  Flag,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const TradingCallCard = ({ tradingCall, onDelete, onEdit, onReport }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete && onDelete(tradingCall);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit && onEdit(tradingCall);
  };

  const handleReport = () => {
    handleMenuClose();
    onReport && onReport(tradingCall);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  const getActionColor = (action) => {
    return action === 'buy' ? 'success.main' : 'error.main';
  };

  const getProfitLossColor = (value) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* 头部信息 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={tradingCall.streamer.avatar}
            sx={{ width: 40, height: 40, mr: 1 }}
          >
            {tradingCall.streamer.username[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1">
              {tradingCall.streamer.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {moment(tradingCall.createdAt).format('YYYY-MM-DD HH:mm')}
            </Typography>
          </Box>
          <Box>
            <Chip
              label={getStatusText(tradingCall.status)}
              color={getStatusColor(tradingCall.status)}
              size="small"
              sx={{ mr: 1 }}
            />
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* 交易信息 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="span">
              {tradingCall.stockCode}
            </Typography>
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ ml: 1, color: getActionColor(tradingCall.action) }}
            >
              {tradingCall.action === 'buy' ? '买入' : '卖出'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {tradingCall.stockName}
          </Typography>
        </Box>

        {/* 价格信息 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              入场价
            </Typography>
            <Typography variant="subtitle1">
              {tradingCall.price}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              目标价
            </Typography>
            <Typography variant="subtitle1" color="success.main">
              {tradingCall.targetPrice}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              止损价
            </Typography>
            <Typography variant="subtitle1" color="error.main">
              {tradingCall.stopLoss}
            </Typography>
          </Box>
          {tradingCall.currentPrice && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                当前价
              </Typography>
              <Typography
                variant="subtitle1"
                color={getProfitLossColor(tradingCall.profitLoss)}
              >
                {tradingCall.currentPrice}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 盈亏进度 */}
        {tradingCall.status === 'active' && tradingCall.profitLoss && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.max((tradingCall.profitLoss / (tradingCall.targetPrice - tradingCall.price)) * 100, 0), 100)}
              color={tradingCall.profitLoss > 0 ? 'success' : 'error'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography
              variant="caption"
              color={getProfitLossColor(tradingCall.profitLoss)}
              sx={{ mt: 0.5, display: 'block' }}
            >
              盈亏: {tradingCall.profitLoss > 0 ? '+' : ''}{tradingCall.profitLoss}%
            </Typography>
          </Box>
        )}

        {/* 交易理由 */}
        <Typography variant="body2" color="text.secondary" paragraph>
          {tradingCall.reason}
        </Typography>

        {/* 操作按钮 */}
        <CardActions sx={{ px: 0 }}>
          <Button
            size="small"
            startIcon={<Comment />}
            onClick={handleExpandClick}
          >
            评论 ({tradingCall.comments?.length || 0})
          </Button>
          <Button
            size="small"
            startIcon={tradingCall.metrics?.liked ? <ThumbUp color="primary" /> : <ThumbUp />}
          >
            点赞 ({tradingCall.metrics?.likes || 0})
          </Button>
          <Button
            size="small"
            startIcon={<Share />}
          >
            分享
          </Button>
        </CardActions>

        {/* 展开的分析内容 */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            技术分析
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {tradingCall.analysis}
          </Typography>
        </Collapse>
      </CardContent>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {(user?.role === 'admin' || user?._id === tradingCall.streamer._id) && [
          <MenuItem key="edit" onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            编辑
          </MenuItem>,
          <MenuItem key="delete" onClick={handleDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            删除
          </MenuItem>
        ]}
        {user && user._id !== tradingCall.streamer._id && (
          <MenuItem onClick={handleReport}>
            <ListItemIcon>
              <Flag fontSize="small" />
            </ListItemIcon>
            举报
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default TradingCallCard;
