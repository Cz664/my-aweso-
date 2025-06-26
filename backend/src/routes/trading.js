const express = require('express');
const router = express.Router();
const TradingCall = require('../models/TradingCall');
const LiveRoom = require('../models/LiveRoom');
const { authenticateUser, requireStreamer } = require('../utils/auth');

// 发布股票喊单
router.post('/', requireStreamer, async (req, res) => {
  try {
    const {
      roomId,
      stockCode,
      stockName,
      action,
      price,
      targetPrice,
      stopLoss,
      reason,
      analysis,
      attachments
    } = req.body;

    // 验证直播间
    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: '直播间不存在' });
    }

    // 验证是否为房主
    if (room.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限在此直播间发布喊单' });
    }

    // 创建喊单
    const tradingCall = new TradingCall({
      room: roomId,
      streamer: req.user._id,
      stockCode,
      stockName,
      action,
      price,
      targetPrice,
      stopLoss,
      reason,
      analysis,
      attachments
    });

    await tradingCall.save();

    // 更新直播间统计
    await room.updateStatistics('tradingCalls', 1);

    res.status(201).json({
      message: '喊单发布成功',
      tradingCall
    });
  } catch (error) {
    console.error('发布喊单错误:', error);
    res.status(500).json({ error: '发布喊单失败' });
  }
});

// 获取直播间喊单列表
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { room: roomId };
    if (status) {
      query.status = status;
    }

    const tradingCalls = await TradingCall.find(query)
      .populate('streamer', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TradingCall.countDocuments(query);

    res.json({
      tradingCalls,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取喊单列表错误:', error);
    res.status(500).json({ error: '获取喊单列表失败' });
  }
});

// 获取喊单详情
router.get('/:id', async (req, res) => {
  try {
    const tradingCall = await TradingCall.findById(req.params.id)
      .populate('streamer', 'username avatar')
      .populate('comments.user', 'username avatar');

    if (!tradingCall) {
      return res.status(404).json({ error: '喊单不存在' });
    }

    res.json({ tradingCall });
  } catch (error) {
    console.error('获取喊单详情错误:', error);
    res.status(500).json({ error: '获取喊单详情失败' });
  }
});

// 更新喊单状态
router.put('/:id/status', requireStreamer, async (req, res) => {
  try {
    const { status, result, currentPrice } = req.body;
    const tradingCall = await TradingCall.findById(req.params.id);

    if (!tradingCall) {
      return res.status(404).json({ error: '喊单不存在' });
    }

    // 验证是否为发布者
    if (tradingCall.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '没有权限更新此喊单' });
    }

    tradingCall.status = status;
    if (result) {
      tradingCall.result = result;
    }
    
    if (currentPrice) {
      await tradingCall.updateResult(currentPrice);
    }

    await tradingCall.save();

    res.json({
      message: '喊单状态更新成功',
      tradingCall
    });
  } catch (error) {
    console.error('更新喊单状态错误:', error);
    res.status(500).json({ error: '更新喊单状态失败' });
  }
});

// 添加评论
router.post('/:id/comments', authenticateUser, async (req, res) => {
  try {
    const { content } = req.body;
    const tradingCall = await TradingCall.findById(req.params.id);

    if (!tradingCall) {
      return res.status(404).json({ error: '喊单不存在' });
    }

    await tradingCall.addComment(req.user._id, content);

    res.status(201).json({
      message: '评论添加成功',
      comment: tradingCall.comments[tradingCall.comments.length - 1]
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

// 获取主播的历史喊单统计
router.get('/streamer/:streamerId/stats', async (req, res) => {
  try {
    const { streamerId } = req.params;
    
    const stats = await TradingCall.aggregate([
      { $match: { streamer: mongoose.Types.ObjectId(streamerId) } },
      { $group: {
        _id: '$result',
        count: { $sum: 1 },
        avgProfitLoss: { $avg: '$profitLoss' }
      }}
    ]);

    const totalCalls = await TradingCall.countDocuments({ streamer: streamerId });

    res.json({
      stats,
      totalCalls
    });
  } catch (error) {
    console.error('获取主播喊单统计错误:', error);
    res.status(500).json({ error: '获取主播喊单统计失败' });
  }
});

// 更新喊单指标
router.put('/:id/metrics', authenticateUser, async (req, res) => {
  try {
    const { type } = req.body;
    const tradingCall = await TradingCall.findById(req.params.id);

    if (!tradingCall) {
      return res.status(404).json({ error: '喊单不存在' });
    }

    await tradingCall.updateMetrics(type);

    res.json({
      message: '指标更新成功',
      metrics: tradingCall.metrics
    });
  } catch (error) {
    console.error('更新喊单指标错误:', error);
    res.status(500).json({ error: '更新喊单指标失败' });
  }
});

module.exports = router;
