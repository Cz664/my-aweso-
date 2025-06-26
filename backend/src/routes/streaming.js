// 推流管理API路由
const express = require('express');
const router = express.Router();

// 推流认证中间件
const authenticateStream = (req, res, next) => {
  const { name, key } = req.body;
  
  // 验证推流密钥
  const validKeys = [
    'futures-live-stream-key-2024',
    'futures-mobile-stream-key',
    'futures-obs-stream-key'
  ];
  
  if (!validKeys.includes(key)) {
    return res.status(403).send('Unauthorized');
  }
  
  next();
};

// 推流认证端点（NGINX RTMP模块调用）
router.post('/auth', (req, res) => {
  const { name, addr, app, swfurl, tcurl } = req.body;
  
  console.log('推流认证请求:', {
    stream: name,
    ip: addr,
    app: app,
    time: new Date().toISOString()
  });
  
  // 这里可以添加更复杂的认证逻辑
  // 例如检查用户权限、推流时长限制等
  
  res.status(200).send('OK');
});

// 获取当前直播状态
router.get('/status', (req, res) => {
  // 这里可以从NGINX RTMP统计接口获取实际数据
  // 或者从Redis/数据库获取状态信息
  res.json({
    status: 'success',
    data: {
      isLive: true,
      streamKey: 'futures-live-stream-key-2024',
      viewers: 0, // 实际应从统计接口获取
      startTime: new Date().toISOString(),
      streamUrl: 'rtmp://193.57.33.111:1935/live',
      playbackUrls: {
        hls: 'http://193.57.33.111/hls/futures-live-stream-key-2024.m3u8',
        rtmp: 'rtmp://193.57.33.111:1935/live/futures-live-stream-key-2024'
      }
    }
  });
});

// 开始推流
router.post('/start', authenticateStream, (req, res) => {
  const { streamKey, title, description } = req.body;
  
  console.log('开始推流:', {
    key: streamKey,
    title: title,
    time: new Date().toISOString()
  });
  
  // 可以在这里记录推流开始时间、更新数据库等
  
  res.json({
    status: 'success',
    message: '推流已开始',
    data: {
      streamKey: streamKey,
      rtmpUrl: `rtmp://193.57.33.111:1935/live/${streamKey}`,
      hlsUrl: `http://193.57.33.111/hls/${streamKey}.m3u8`
    }
  });
});

// 停止推流
router.post('/stop', (req, res) => {
  const { streamKey } = req.body;
  
  console.log('停止推流:', {
    key: streamKey,
    time: new Date().toISOString()
  });
  
  // 可以在这里记录推流结束时间、清理资源等
  
  res.json({
    status: 'success',
    message: '推流已停止'
  });
});

// 获取推流统计信息
router.get('/stats', async (req, res) => {
  try {
    // 这里可以调用NGINX RTMP统计接口
    // const response = await fetch('http://nginx-rtmp/stat');
    // const stats = await response.text();
    
    // 模拟返回统计数据
    res.json({
      status: 'success',
      data: {
        totalStreams: 1,
        activeStreams: 1,
        totalViewers: 0,
        bandwidth: '2.5 Mbps',
        uptime: '15 minutes',
        streams: [
          {
            name: 'futures-live-stream-key-2024',
            viewers: 0,
            startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            bandwidth: '2.5 Mbps',
            resolution: '1920x1080',
            fps: 30
          }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

// 生成新的推流密钥
router.post('/generate-key', (req, res) => {
  const { userId, streamType = 'live' } = req.body;
  
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const newKey = `futures-${streamType}-${timestamp}-${randomStr}`;
  
  res.json({
    status: 'success',
    data: {
      streamKey: newKey,
      rtmpUrl: `rtmp://193.57.33.111:1935/live/${newKey}`,
      hlsUrl: `http://193.57.33.111/hls/${newKey}.m3u8`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期
    }
  });
});

// 推流配置信息
router.get('/config', (req, res) => {
  res.json({
    status: 'success',
    data: {
      rtmpServer: 'rtmp://193.57.33.111:1935/live',
      defaultStreamKey: 'futures-live-stream-key-2024',
      supportedFormats: ['RTMP', 'HLS'],
      maxBitrate: '5000 Kbps',
      recommendedSettings: {
        resolution: '1920x1080',
        fps: 30,
        bitrate: '2500 Kbps',
        encoder: 'H.264',
        audioCodec: 'AAC',
        audioBitrate: '160 Kbps'
      },
      obsSettings: {
        service: 'Custom...',
        server: 'rtmp://193.57.33.111:1935/live',
        streamKey: 'futures-live-stream-key-2024'
      }
    }
  });
});

module.exports = router;
