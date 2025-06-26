const express = require('express');
const router = express.Router();
const LiveRoom = require('../models/LiveRoom');
const { authenticateUser, requireStreamer } = require('../utils/auth');
const { generateRandomKey } = require('../utils/auth');

// 创建直播间
router.post('/', requireStreamer, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    const streamKey = generateRandomKey();
    
    const liveRoom = new LiveRoom({
      title,
      description,
      tags,
      streamer: req.user._id,
      streamKey
    });

    await liveRoom.save();

    res.status(201).json({
      message: '直播间创建成功',
      room: {
        id: liveRoom._id,
        title: liveRoom.title,
        description: liveRoom.description,
        streamKey: liveRoom.streamKey,
        status: liveRoom.status
      }
    });
  } catch (error) {
    console.error('创建直播间错误:', error);
    res.status(500).json({ error: '创建直播间失败' });
  }
});

// 获取直播间列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};

    const rooms = await LiveRoom.find(query)
      .populate('streamer', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LiveRoom.countDocuments(query);

    res.json({
      rooms,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取直播间列表错误:', error);
    res.status(500).json({ error: '获取直播间列表失败' });
  }
});

// 获取直播间详情
router.get('/:id', async (req, res) => {
  try {
    const room = await LiveRoom.findById(req.params.id)
      .populate('streamer', 'username avatar');

    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    res.json({ room });
  } catch (error) {
    console.error('获取直播间详情错误:', error);
    res.status(500).json({ error: '获取直播间详情失败' });
  }
});

// 更新直播间信息
router.put('/:id', requireStreamer, async (req, res) => {
  try {
    const { title, description, tags, settings } = req.body;
    const room = await LiveRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 验证是否为房主
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限修改此直播间' });
    }

    // 更新信息
    if (title) room.title = title;
    if (description) room.description = description;
    if (tags) room.tags = tags;
    if (settings) room.settings = { ...room.settings, ...settings };

    await room.save();

    res.json({
      message: '直播间信息更新成功',
      room
    });
  } catch (error) {
    console.error('更新直播间信息错误:', error);
    res.status(500).json({ error: '更新直播间信息失败' });
  }
});

// 开始直播
router.post('/:id/start', requireStreamer, async (req, res) => {
  try {
    const room = await LiveRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 验证是否为房主
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限操作此直播间' });
    }

    room.status = 'live';
    room.startTime = new Date();
    await room.save();

    res.json({
      message: '直播已开始',
      room: {
        id: room._id,
        status: room.status,
        startTime: room.startTime
      }
    });
  } catch (error) {
    console.error('开始直播错误:', error);
    res.status(500).json({ error: '开始直播失败' });
  }
});

// 结束直播
router.post('/:id/end', requireStreamer, async (req, res) => {
  try {
    const room = await LiveRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 验证是否为房主
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限操作此直播间' });
    }

    room.status = 'offline';
    room.endTime = new Date();
    await room.save();

    res.json({
      message: '直播已结束',
      room: {
        id: room._id,
        status: room.status,
        endTime: room.endTime
      }
    });
  } catch (error) {
    console.error('结束直播错误:', error);
    res.status(500).json({ error: '结束直播失败' });
  }
});

// 获取直播间统计信息
router.get('/:id/stats', requireStreamer, async (req, res) => {
  try {
    const room = await LiveRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 验证是否为房主
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限查看此直播间统计信息' });
    }

    res.json({
      statistics: room.statistics,
      currentViewers: room.viewers
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// 重置直播密钥
router.post('/:id/reset-key', requireStreamer, async (req, res) => {
  try {
    const room = await LiveRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 验证是否为房主
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限重置此直播间密钥' });
    }

    room.streamKey = generateRandomKey();
    await room.save();

    res.json({
      message: '直播密钥重置成功',
      streamKey: room.streamKey
    });
  } catch (error) {
    console.error('重置直播密钥错误:', error);
    res.status(500).json({ error: '重置直播密钥失败' });
  }
});

module.exports = router;
