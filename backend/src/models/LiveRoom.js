const mongoose = require('mongoose');

const liveRoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['live', 'offline', 'scheduled'],
    default: 'offline'
  },
  streamKey: {
    type: String,
    required: true,
    unique: true
  },
  viewers: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  settings: {
    chat: {
      enabled: {
        type: Boolean,
        default: true
      },
      slowMode: {
        type: Boolean,
        default: false
      },
      slowModeInterval: {
        type: Number,
        default: 5
      }
    },
    trading: {
      enabled: {
        type: Boolean,
        default: true
      },
      autoApprove: {
        type: Boolean,
        default: false
      }
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: 'default-thumbnail.jpg'
  },
  statistics: {
    totalViewers: {
      type: Number,
      default: 0
    },
    peakViewers: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTradingCalls: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 生成唯一的直播密钥
liveRoomSchema.pre('save', async function(next) {
  if (!this.isModified('streamKey')) {
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    this.streamKey = `live_${this._id}_${randomString}`;
  }
  next();
});

// 更新统计信息的方法
liveRoomSchema.methods.updateStatistics = async function(type, value) {
  switch(type) {
    case 'viewers':
      this.statistics.totalViewers += value;
      if (this.viewers > this.statistics.peakViewers) {
        this.statistics.peakViewers = this.viewers;
      }
      break;
    case 'messages':
      this.statistics.totalMessages += value;
      break;
    case 'tradingCalls':
      this.statistics.totalTradingCalls += value;
      break;
  }
  await this.save();
};

module.exports = mongoose.model('LiveRoom', liveRoomSchema);
