const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const LiveRoom = require('../models/LiveRoom');
const { authenticateUser, requireStreamer } = require('../utils/auth');

// 获取直播间聊天记录
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 验证直播间
    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    const messages = await ChatMessage.find({ 
      room: roomId,
      status: { $ne: 'deleted' }
    })
      .populate('user', 'username avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({ 
      room: roomId,
      status: { $ne: 'deleted' }
    });

    res.json({
      messages: messages.reverse(), // 返回时反转顺序，使消息按时间正序排列
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取聊天记录错误:', error);
    res.status(500).json({ error: '获取聊天记录失败' });
  }
});

// 发送消息（通过HTTP，通常用于系统消息）
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { roomId, content, type = 'text', metadata = {}, replyTo } = req.body;

    // 验证直播间
    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 检查直播间聊天设置
    if (!room.settings.chat.enabled) {
      return res.status(403).json({ error: '直播间聊天已禁用' });
    }

    // 检查慢速模式
    if (room.settings.chat.slowMode) {
      const lastMessage = await ChatMessage.findOne({
        room: roomId,
        user: req.user._id
      }).sort({ createdAt: -1 });

      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - lastMessage.createdAt.getTime();
        const slowModeInterval = room.settings.chat.slowModeInterval * 1000; // 转换为毫秒

        if (timeSinceLastMessage < slowModeInterval) {
          return res.status(429).json({ 
            error: '发言太快了，请稍后再试',
            waitTime: Math.ceil((slowModeInterval - timeSinceLastMessage) / 1000)
          });
        }
      }
    }

    const message = new ChatMessage({
      room: roomId,
      user: req.user._id,
      content,
      type,
      metadata,
      replyTo
    });

    await message.save();

    // 更新直播间消息统计
    await room.updateStatistics('messages', 1);

    // 填充用户信息后返回
    await message.populate('user', 'username avatar');
    if (replyTo) {
      await message.populate('replyTo');
    }

    res.status(201).json({
      message: '消息发送成功',
      chatMessage: message
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

// 删除消息
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    // 验证权限（消息发送者或主播可以删除消息）
    const room = await LiveRoom.findById(message.room);
    const isStreamer = room.streamer.toString() === req.user._id.toString();
    const isMessageOwner = message.user.toString() === req.user._id.toString();

    if (!isStreamer && !isMessageOwner) {
      return res.status(403).json({ error: '没有权限删除此消息' });
    }

    await message.softDelete(req.user._id, '用户删除');

    res.json({ message: '消息删除成功' });
  } catch (error) {
    console.error('删除消息错误:', error);
    res.status(500).json({ error: '删除消息失败' });
  }
});

// 添加消息反应
router.post('/:id/reactions', authenticateUser, async (req, res) => {
  try {
    const { type } = req.body;
    const message = await ChatMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    const reactions = await message.addReaction(req.user._id, type);

    res.json({
      message: '反应添加成功',
      reactions
    });
  } catch (error) {
    console.error('添加反应错误:', error);
    res.status(500).json({ error: '添加反应失败' });
  }
});

// 置顶/取消置顶消息
router.put('/:id/pin', requireStreamer, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    // 验证是否为直播间主播
    const room = await LiveRoom.findById(message.room);
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限操作此消息' });
    }

    const isPinned = await message.togglePin();

    res.json({
      message: isPinned ? '消息已置顶' : '消息已取消置顶',
      isPinned
    });
  } catch (error) {
    console.error('置顶消息错误:', error);
    res.status(500).json({ error: '置顶消息失败' });
  }
});

// 高亮/取消高亮消息
router.put('/:id/highlight', requireStreamer, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    // 验证是否为直播间主播
    const room = await LiveRoom.findById(message.room);
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限操作此消息' });
    }

    const isHighlighted = await message.toggleHighlight();

    res.json({
      message: isHighlighted ? '消息已高亮' : '消息已取消高亮',
      isHighlighted
    });
  } catch (error) {
    console.error('高亮消息错误:', error);
    res.status(500).json({ error: '高亮消息失败' });
  }
});

// 获取置顶消息列表
router.get('/room/:roomId/pinned', async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await ChatMessage.find({
      room: roomId,
      isPinned: true,
      status: { $ne: 'deleted' }
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    console.error('获取置顶消息错误:', error);
    res.status(500).json({ error: '获取置顶消息失败' });
  }
});

module.exports = router;
