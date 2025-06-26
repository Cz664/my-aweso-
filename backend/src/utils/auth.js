const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证JWT令牌
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    throw new Error('无效的令牌');
  }
};

// 中间件：验证用户身份
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '访问被拒绝，需要令牌' });
    }

    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '令牌无效' });
  }
};

// 中间件：验证管理员权限
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证的用户' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: '权限验证失败' });
  }
};

// 中间件：验证主播权限
const requireStreamer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证的用户' });
    }

    if (req.user.role !== 'streamer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要主播权限' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: '权限验证失败' });
  }
};

// 生成随机密钥
const generateRandomKey = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 验证密码强度
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`密码长度至少为${minLength}位`);
  }
  
  if (!hasUpperCase) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (!hasLowerCase) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (!hasNumbers) {
    errors.push('密码必须包含至少一个数字');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  requireAdmin,
  requireStreamer,
  generateRandomKey,
  validatePassword
};
