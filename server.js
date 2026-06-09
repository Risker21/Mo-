/**
 * Mo小窝 - Express 主服务
 * 整合认证路由和 AI 聊天路由
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const authRouter = require('./api/auth');
const { PROJECT_KNOWLEDGE } = require('./api/site-knowledge');

const app = express();

// ---- 中间件 ----
app.use(express.json({ limit: '1mb' }));

// ---- 静态文件服务 ----
// 项目根目录的静态文件
app.use(express.static(path.join(__dirname)));
// login_in 目录的静态文件
app.use('/login_in', express.static(path.join(__dirname, 'login_in')));
// ai 目录的静态文件（Lottie 动画）
app.use('/ai', express.static(path.join(__dirname, 'login_in', 'ai')));

// ---- 根路径重定向到登录页 ----
app.get('/', (req, res) => {
  res.redirect('/login_in/login.html');
});

// ---- 认证路由 ----
app.use('/api/auth', authRouter);

// ---- 验证码 API ----
const CAPTCHA_ID = process.env.API_ID;
const CAPTCHA_KEY = process.env.API_KEY;

// 获取验证码
app.get('/api/captcha/get', async (req, res) => {
  try {
    const response = await fetch(`http://101.35.2.25/api/xingkong/xk6get.php?id=${CAPTCHA_ID}&key=${CAPTCHA_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('[CAPTCHA获取] 错误:', e.message);
    res.status(502).json({ code: 400, msg: '验证码获取失败' });
  }
});

// 代理验证码图片（避免混合内容问题）
app.get('/api/captcha/image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Missing url parameter');
    }
    const response = await fetch(imageUrl);
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'image/jpeg');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('[CAPTCHA图片代理] 错误:', e.message);
    res.status(502).send('Image proxy error');
  }
});

// 验证验证码
app.post('/api/captcha/verify', async (req, res) => {
  try {
    const { code, md5key } = req.body;
    if (!code || !md5key) {
      return res.status(400).json({ code: 400, msg: '参数不完整' });
    }
    const response = await fetch(`http://101.35.2.25/api/xingkong/xk6yz.php?id=${CAPTCHA_ID}&key=${CAPTCHA_KEY}&code=${encodeURIComponent(code)}&md5key=${encodeURIComponent(md5key)}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('[CAPTCHA验证] 错误:', e.message);
    res.status(502).json({ code: 400, msg: '验证码验证失败' });
  }
});

// ---- AI 聊天路由 ----

// 简单的内存速率限制器
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟
const RATE_LIMIT_MAX = 10; // 每个IP每分钟最多10个请求

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }

  validRequests.push(now);
  rateLimit.set(ip, validRequests);
  return true;
}

app.post('/api/chat', async (req, res) => {
  // 获取客户端IP地址
  const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  // 检查速率限制
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const rawBaseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim();
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  const customSystemPrompt = process.env.AI_SYSTEM_PROMPT || '';

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing AI_API_KEY environment variable.' });
  }

  try {
    const body = req.body || {};
    const userMessage = (body.message || '').toString().trim();
    const currentPage = (body.currentPage || '').toString().trim();
    const pageTitle = (body.pageTitle || '').toString().trim();
    const musicInfo = body.musicInfo || null;
    const useStream = body.stream !== false;

    if (!userMessage) {
      return res.status(400).json({ error: 'message is required.' });
    }

    if (userMessage.length > 1000) {
      return res.status(400).json({ error: 'Message too long. Maximum 1000 characters allowed.' });
    }

    // 构建音乐信息上下文
    let musicContext = '';
    if (musicInfo) {
      musicContext = `
当前播放音乐信息：
- 音乐名称: ${musicInfo.title || 'unknown'}
- 播放状态: ${musicInfo.isPlaying ? '正在播放' : '已暂停'}
- 播放进度: ${Math.round(musicInfo.currentTime)}/${Math.round(musicInfo.duration)}秒
- 音量: ${Math.round(musicInfo.volume * 100)}%
${musicInfo.nextTitle ? `- 下一首: ${musicInfo.nextTitle}` : ''}
`.trim();
    }

    const runtimeContext = `
当前页面信息：
- pageTitle: ${pageTitle || 'unknown'}
- currentPage: ${currentPage || 'unknown'}
${musicContext ? `
${musicContext}` : ''}
`.trim();

    // 兼容用户把 AI_BASE_URL 填成 .../v1、.../v1/ 或 .../chat/completions 三种格式
    const requestUrl = /\/chat\/completions\/?$/.test(baseUrl)
      ? baseUrl
      : (baseUrl + '/chat/completions');

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        stream: useStream,
        messages: [
          { role: 'system', content: [PROJECT_KNOWLEDGE, customSystemPrompt].filter(Boolean).join('\n\n') },
          { role: 'system', content: runtimeContext },
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: 'Upstream API error',
        detail: errText
      });
    }

    if (useStream) {
      if (!response.body) {
        return res.status(502).json({ error: 'Upstream stream is empty.' });
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }

      res.end();
      return;
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({ error: 'Empty response from model provider.' });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      detail: error.message
    });
  }
});

// ---- 健康检查 ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---- 本地开发服务器 ----
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8888;
  app.listen(PORT, () => {
    console.log(`Mo小窝开发服务器已启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
