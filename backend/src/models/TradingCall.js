const mongoose = require('mongoose');

const tradingCallSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveRoom',
    required: true
  },
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stockCode: {
    type: String,
    required: true,
    trim: true
  },
  stockName: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    enum: ['买入', '卖出', '观望'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  targetPrice: {
    type: Number
  },
  stopLoss: {
    type: Number
  },
  reason: {
    type: String,
    trim: true
  },
  analysis: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['进行中', '已完成', '已取消'],
    default: '进行中'
  },
  result: {
    type: String,
    enum: ['盈利', '亏损', '持平', '未知'],
    default: '未知'
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'chart', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: String
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// 索引优化查询性能
tradingCallSchema.index({ room: 1, createdAt: -1 });
tradingCallSchema.index({ streamer: 1, createdAt: -1 });
tradingCallSchema.index({ stockCode: 1, createdAt: -1 });

// 更新交易结果的方法
tradingCallSchema.methods.updateResult = async function(currentPrice) {
  if (this.action === '买入') {
    this.profitLoss = ((currentPrice - this.price) / this.price) * 100;
  } else if (this.action === '卖出') {
    this.profitLoss = ((this.price - currentPrice) / this.price) * 100;
  }

  if (this.profitLoss > 0) {
    this.result = '盈利';
  } else if (this.profitLoss < 0) {
    this.result = '亏损';
  } else {
    this.result = '持平';
  }

  await this.save();
};

// 添加评论的方法
tradingCallSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  await this.save();
};

// 更新统计数据的方法
tradingCallSchema.methods.updateMetrics = async function(type) {
  switch(type) {
    case 'view':
      this.metrics.views += 1;
      break;
    case 'like':
      this.metrics.likes += 1;
      break;
    case 'share':
      this.metrics.shares += 1;
      break;
  }
  await this.save();
};

module.exports = mongoose.model('TradingCall', tradingCallSchema);
