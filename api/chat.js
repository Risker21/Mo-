const { PROJECT_KNOWLEDGE } = require('./site-knowledge');

// 简单的内存速率限制器
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟
const RATE_LIMIT_MAX = 10; // 每个IP每分钟最多10个请求

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = rateLimit.get(ip) || [];
    
    // 清理过期的请求记录
    const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    validRequests.push(now);
    rateLimit.set(ip, validRequests);
    return true;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 获取客户端IP地址
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
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
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
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
};
