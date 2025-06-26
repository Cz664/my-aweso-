# OBS直播推流配置指南

## 🎥 OBS推流到国际期货直播间

### 📋 前置要求

1. **安装OBS Studio**
   - 下载地址：https://obsproject.com/
   - 支持Windows、macOS、Linux

2. **确保直播服务器正常运行**
   - 前端访问：http://193.57.33.111
   - API服务：http://193.57.33.111:3001

### 🔧 OBS推流配置

#### 方法一：RTMP推流配置

1. **打开OBS Studio**
2. **进入设置** → **推流**
3. **配置推流参数**：
   ```
   服务: 自定义...
   服务器: rtmp://193.57.33.111:1935/live
   推流密钥: futures-live-stream-key-2024
   ```

4. **高级设置**：
   ```
   编码器: x264
   比特率控制: CBR
   比特率: 2500 Kbps（根据网络调整）
   关键帧间隔: 2秒
   CPU使用预设: veryfast
   配置文件: main
   ```

#### 方法二：WebRTC推流（推荐）

如果支持WebRTC，配置如下：
```
推流地址: https://193.57.33.111/webrtc-ingest
房间ID: futures-room-1
推流密钥: futures-webrtc-2024
```

### 🎬 场景设置建议

#### 1. 主播场景配置
```
来源添加：
- 摄像头/视频捕获设备（主播画面）
- 显示器捕获（交易软件/图表）
- 文本（直播间标题、时间）
- 图像（Logo、水印）
- 浏览器源（实时价格插件）
```

#### 2. 推荐布局
```
┌─────────────────────────────────┐
│  [Logo]           [实时时间]    │
│                                 │
│  ┌─────────────┐ ┌─────────────┐ │
│  │             │ │   主播画面   │ │
│  │  交易图表   │ │             │ │
│  │             │ └─────────────┘ │
│  └─────────────┘                │
│                                 │
│  实时价格条 | 直播间标题         │
└─────────────────────────────────┘
```

### 📊 音频配置

#### 1. 音频设备设置
```
麦克风/辅助音频: 主播麦克风
桌面音频: 系统声音（交易软件提示音）
音频比特率: 160 Kbps
采样率: 44.1 kHz
声道: 立体声
```

#### 2. 音频滤镜推荐
```
噪音抑制: RNNoise (AI降噪)
噪音门限: 启用（-35dB）
压缩器: 启用（比例3:1）
音量: 根据需要调整
```

### 🖥️ 视频配置

#### 1. 输出设置
```
输出分辨率: 1920x1080 (1080p)
帧率: 30 FPS
编码器: H.264 (x264)
速率控制: CBR
比特率: 2500-5000 Kbps
```

#### 2. 高级配置
```
色彩空间: 709
色彩范围: Partial
编码器预设: veryfast
配置文件: main
调优: zerolatency（低延迟）
```

### 🌐 直播服务器配置

如果需要搭建自己的推流服务器，可以使用以下配置：

#### 1. 添加NGINX-RTMP模块

在 `nginx.conf` 中添加：

```nginx
# RTMP配置
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            record off;
            
            # 推流认证
            on_publish http://localhost:3001/api/stream/auth;
            
            # HLS配置
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # 推流到前端
            push rtmp://localhost/playback;
        }
        
        application playback {
            live on;
            record off;
            
            # 允许所有IP播放
            allow play all;
        }
    }
}

# HTTP配置
http {
    # HLS播放
    location /hls {
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
        root /tmp;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
    }
}
```

#### 2. 更新Docker Compose

在 `docker-compose.yml` 中添加RTMP端口：

```yaml
nginx:
  # ...existing config...
  ports:
    - "80:80"
    - "443:443"
    - "1935:1935"  # RTMP端口
  # ...
```

### 📱 移动端推流配置

#### iOS推流应用推荐：
- **Larix Broadcaster**
- **Streamlabs Mobile**
- **Prism Live Studio**

#### Android推流应用推荐：
- **Streamlabs Mobile**
- **Open Camera**
- **CameraFi Live**

#### 移动端推流设置：
```
RTMP URL: rtmp://193.57.33.111:1935/live
流密钥: futures-mobile-stream-key
分辨率: 1280x720 (720p)
帧率: 30 FPS
比特率: 1500-2500 Kbps
```

### 🎮 直播互动功能

#### 1. 聊天系统集成
在OBS中添加浏览器源：
```
URL: http://193.57.33.111/chat-overlay
宽度: 400
高度: 600
CSS: 
body { 
  background: transparent; 
  font-family: Arial; 
  color: white;
  text-shadow: 1px 1px 2px black;
}
```

#### 2. 实时数据显示
添加浏览器源显示实时价格：
```
URL: http://193.57.33.111/price-ticker
宽度: 1920
高度: 80
刷新间隔: 1000ms
```

### 🔍 故障排除

#### 1. 推流失败
```bash
# 检查RTMP端口
telnet 193.57.33.111 1935

# 检查服务器日志
docker-compose logs nginx

# 测试推流地址
ffmpeg -re -i test.mp4 -c copy -f flv rtmp://193.57.33.111:1935/live/test
```

#### 2. 画面卡顿
- 降低输出分辨率（1080p → 720p）
- 降低帧率（30fps → 25fps）
- 降低比特率
- 检查网络带宽

#### 3. 音画不同步
- 添加音频延迟补偿
- 检查音频设备缓冲区设置
- 重启OBS和音频设备

### 📋 推流检查清单

#### 推流前检查：
- [ ] 网络带宽充足（上行 > 比特率 × 1.5）
- [ ] 音频设备正常工作
- [ ] 摄像头画面清晰
- [ ] 交易软件窗口可见
- [ ] 推流密钥正确配置
- [ ] 场景切换测试正常

#### 直播中监控：
- [ ] 观看人数统计
- [ ] 网络状态稳定
- [ ] CPU/GPU使用率正常
- [ ] 音频电平适中
- [ ] 聊天消息回复

### 🎯 优化建议

#### 1. 硬件优化
```
推荐配置：
CPU: Intel i5-8400 或 AMD Ryzen 5 2600X 以上
GPU: NVIDIA GTX 1060 或 AMD RX 580 以上
内存: 16GB DDR4
网络: 上行带宽 10Mbps 以上
```

#### 2. 软件优化
```
OBS设置：
- 启用硬件编码（NVENC/AMF）
- 使用游戏模式
- 关闭不必要的滤镜
- 优化场景复杂度
```

#### 3. 网络优化
```
- 使用有线网络连接
- 配置QoS优先级
- 避免网络高峰期
- 准备4G/5G备用网络
```

### 🔗 相关链接

- **OBS官方文档**: https://obsproject.com/wiki/
- **推流测试工具**: https://testmy.net/
- **RTMP验证器**: https://rtmp.vercel.app/
- **直播质量监控**: http://193.57.33.111/stream-monitor

### 📞 技术支持

如遇推流问题，请提供以下信息：
1. OBS版本和操作系统
2. 推流设置截图
3. 错误日志信息
4. 网络速度测试结果

---

**🎬 开始直播，分享专业的期货分析！**
