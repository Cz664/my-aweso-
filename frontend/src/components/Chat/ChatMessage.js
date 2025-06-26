import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  MoreVert,
  Delete,
  Reply,
  Flag,
  PushPin,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const ChatMessage = ({ message, isOwnMessage, onReply, onDelete, onReport }) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    handleMenuClose();
    onReply && onReply(message);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete && onDelete(message);
  };

  const handleReport = () => {
    handleMenuClose();
    onReport && onReport(message);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        mb: 2,
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
      }}
    >
      <Avatar
        src={message.user.avatar}
        alt={message.user.username}
        sx={{ width: 32, height: 32, mr: isOwnMessage ? 0 : 1, ml: isOwnMessage ? 1 : 0 }}
      >
        {message.user.username[0]}
      </Avatar>

      <Box sx={{ maxWidth: '70%' }}>
        {/* 用户名和时间 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 0.5,
            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          }}
        >
          <Typography
            variant="subtitle2"
            color={message.user.role === 'streamer' ? 'primary' : 'textPrimary'}
            sx={{ mr: isOwnMessage ? 0 : 1, ml: isOwnMessage ? 1 : 0 }}
          >
            {message.user.username}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {moment(message.createdAt).format('HH:mm')}
          </Typography>
        </Box>

        {/* 消息内容 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Paper
            elevation={1}
            sx={{
              p: 1,
              bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            {/* 回复消息 */}
            {message.replyTo && (
              <Box
                sx={{
                  borderLeft: 2,
                  borderColor: 'divider',
                  pl: 1,
                  mb: 1,
                  opacity: 0.7,
                }}
              >
                <Typography variant="caption" display="block">
                  回复 {message.replyTo.user.username}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {message.replyTo.content}
                </Typography>
              </Box>
            )}

            {/* 消息文本 */}
            <Typography
              variant="body2"
              sx={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {message.content}
            </Typography>

            {/* 交易喊单 */}
            {message.type === 'tradingCall' && message.metadata.tradingCall && (
              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="primary" display="block">
                  交易信号
                </Typography>
                <Typography variant="body2">
                  {message.metadata.tradingCall.stockCode} - {message.metadata.tradingCall.action}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  价格: {message.metadata.tradingCall.price}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* 消息操作菜单 */}
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1, opacity: anchorEl ? 1 : 0, '&:hover': { opacity: 1 } }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReply}>
          <ListItemIcon>
            <Reply fontSize="small" />
          </ListItemIcon>
          回复
        </MenuItem>
        {(isOwnMessage || user?.role === 'admin' || user?.role === 'streamer') && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            删除
          </MenuItem>
        )}
        {!isOwnMessage && (
          <MenuItem onClick={handleReport}>
            <ListItemIcon>
              <Flag fontSize="small" />
            </ListItemIcon>
            举报
          </MenuItem>
        )}
        {(user?.role === 'admin' || user?.role === 'streamer') && (
          [
            <MenuItem key="pin" onClick={handleMenuClose}>
              <ListItemIcon>
                <PushPin fontSize="small" />
              </ListItemIcon>
              置顶
            </MenuItem>,
            <MenuItem key="highlight" onClick={handleMenuClose}>
              <ListItemIcon>
                <Star fontSize="small" />
              </ListItemIcon>
              高亮
            </MenuItem>
          ]
        )}
      </Menu>
    </Box>
  );
};

export default ChatMessage;
