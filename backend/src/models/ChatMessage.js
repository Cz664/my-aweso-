const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveRoom',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'system', 'tradingCall'],
    default: 'text'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    tradingCall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradingCall'
    },
    imageUrl: String,
    systemType: {
      type: String,
      enum: ['join', 'leave', 'gift', 'follow', 'subscribe']
    }
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'deleted'],
    default: 'sent'
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'laugh', 'wow', 'sad', 'angry']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderationReason: String
}, {
  timestamps: true
});

// 索引优化查询性能
chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, createdAt: -1 });

// 添加反应的方法
chatMessageSchema.methods.addReaction = async function(userId, reactionType) {
  // 检查用户是否已经添加过相同的反应
  const existingReaction = this.reactions.find(
    reaction => reaction.user.toString() === userId.toString() && 
                reaction.type === reactionType
  );

  if (existingReaction) {
    // 如果已存在相同反应，则移除它
    this.reactions = this.reactions.filter(
      reaction => !(reaction.user.toString() === userId.toString() && 
                   reaction.type === reactionType)
    );
  } else {
    // 移除用户之前的其他反应
    this.reactions = this.reactions.filter(
      reaction => reaction.user.toString() !== userId.toString()
    );
    // 添加新反应
    this.reactions.push({
      user: userId,
      type: reactionType
    });
  }

  await this.save();
  return this.reactions;
};

// 软删除消息的方法
chatMessageSchema.methods.softDelete = async function(moderatorId, reason) {
  this.status = 'deleted';
  this.isModerated = true;
  this.moderatedBy = moderatorId;
  this.moderationReason = reason;
  await this.save();
};

// 置顶消息的方法
chatMessageSchema.methods.togglePin = async function() {
  this.isPinned = !this.isPinned;
  await this.save();
  return this.isPinned;
};

// 高亮消息的方法
chatMessageSchema.methods.toggleHighlight = async function() {
  this.isHighlighted = !this.isHighlighted;
  await this.save();
  return this.isHighlighted;
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
