// MongoDB初始化脚本
db = db.getSiblingDB('futures-trading');

// 创建管理员用户
db.users.insertOne({
  username: 'admin',
  email: 'admin@futures-trading.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'admin',
  avatar: 'default-avatar.png',
  isActive: true,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

// 创建示例主播用户
db.users.insertOne({
  username: 'streamer1',
  email: 'streamer1@futures-trading.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'streamer',
  avatar: 'default-avatar.png',
  isActive: true,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

// 创建示例直播间
const streamerId = db.users.findOne({username: 'streamer1'})._id;
db.liverooms.insertOne({
  title: '国际期货实时分析',
  streamer: streamerId,
  description: '专业期货分析师为您提供实时市场分析和交易建议',
  status: 'offline',
  streamKey: 'live_' + new ObjectId().toString() + '_demo123',
  viewers: 0,
  settings: {
    chat: {
      enabled: true,
      slowMode: false,
      slowModeInterval: 5
    },
    trading: {
      enabled: true,
      autoApprove: false
    }
  },
  tags: ['期货', '黄金', '原油', '外汇'],
  thumbnail: 'default-thumbnail.jpg',
  statistics: {
    totalViewers: 0,
    peakViewers: 0,
    totalMessages: 0,
    totalTradingCalls: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// 创建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.liverooms.createIndex({ streamer: 1 });
db.liverooms.createIndex({ status: 1 });
db.chatmessages.createIndex({ room: 1, createdAt: -1 });
db.tradingcalls.createIndex({ room: 1, createdAt: -1 });
db.tradingcalls.createIndex({ streamer: 1, createdAt: -1 });

print('数据库初始化完成');
print('管理员账号: admin@futures-trading.com / password');
print('主播账号: streamer1@futures-trading.com / password');
