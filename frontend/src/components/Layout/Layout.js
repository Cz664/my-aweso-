import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  LiveTv,
  Dashboard,
  TrendingUp,
  Login,
  PersonAdd,
  Settings,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const { user, isAdmin, isStreamer, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationEl, setNotificationEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box>
      <List>
        <ListItem button component={RouterLink} to="/">
          <ListItemIcon>
            <LiveTv />
          </ListItemIcon>
          <ListItemText primary="期货直播大厅" />
        </ListItem>
        
        {isStreamer && (
          <ListItem button component={RouterLink} to="/admin">
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary={isAdmin ? "管理控制台" : "主播控制台"} />
          </ListItem>
        )}

        <ListItem button component={RouterLink} to="/trending">
          <ListItemIcon>
            <TrendingUp />
          </ListItemIcon>
          <ListItemText primary="热门喊单" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 顶部导航栏 */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <LiveTv />
            国际期货直播间
          </Typography>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* 通知按钮 */}
              <IconButton
                color="inherit"
                onClick={handleNotificationMenuOpen}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* 用户头像和菜单 */}
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ padding: 0.5 }}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.username}
                  sx={{ width: 32, height: 32 }}
                >
                  {user.username[0]}
                </Avatar>
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                startIcon={<Login />}
                component={RouterLink}
                to="/login"
              >
                登录
              </Button>
              <Button
                color="inherit"
                startIcon={<PersonAdd />}
                component={RouterLink}
                to="/register"
              >
                注册
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* 侧边导航抽屉 */}
      <Box
        component="nav"
        sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
      >
        {/* 移动端抽屉 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: 240 },
          }}
        >
          {drawer}
        </Drawer>

        {/* 桌面端固定抽屉 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
          }}
          open
        >
          <Toolbar /> {/* 为顶部导航栏留出空间 */}
          {drawer}
        </Drawer>
      </Box>

      {/* 主要内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          mt: '64px', // 顶部导航栏高度
        }}
      >
        <Outlet />
      </Box>

      {/* 用户菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/profile');
          }}
        >
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          个人资料
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/settings');
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          设置
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          退出登录
        </MenuItem>
      </Menu>

      {/* 通知菜单 */}
      <Menu
        anchorEl={notificationEl}
        open={Boolean(notificationEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="inherit" noWrap>
            您关注的主播开播了
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="inherit" noWrap>
            新的期货喊单提醒
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="inherit" noWrap>
            系统公告
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/notifications');
          }}
        >
          查看全部通知
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
