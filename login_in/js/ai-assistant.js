(function () {
    const endpoint = '/api/chat';

    // ---- 样式注入 ----
    const style = document.createElement('style');
    style.textContent = `
        /* Chat Button */
        .chat-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 130px;
            height: 130px;
            border: none;
            background: transparent;
            box-shadow: none;
            cursor: grab;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            outline: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
            padding: 0;
        }
        .chat-btn:hover { transform: none; }
        .chat-btn:focus-visible { outline: none; }
        .chat-btn dotlottie-wc { width: 100%; height: 100%; pointer-events: none; }
        .chat-btn svg { pointer-events: none; filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.4)); }

        /* Chat Panel */
        .chat-panel {
            position: fixed;
            bottom: 140px;
            right: 24px;
            width: 350px;
            height: 60vh;
            max-height: 540px;
            background: #fff;
            border: 1px solid rgba(102, 126, 234, 0.2);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            z-index: 9998;
            display: none;
            flex-direction: column;
            animation: chatEnter 0.25s ease-out;
            overflow: hidden;
        }
        .chat-panel.open { display: flex; }

        @keyframes chatEnter {
            from { opacity: 0; transform: translateY(10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .chat-header {
            padding: 14px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #fff;
        }
        .chat-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .chat-header-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            flex-shrink: 0;
        }
        .chat-header-info {
            display: flex;
            flex-direction: column;
        }
        .chat-header-name {
            font-weight: 600;
            font-size: 0.9rem;
            line-height: 1.3;
        }
        .chat-header-status {
            font-size: 0.65rem;
            opacity: 0.75;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .chat-header-status::before {
            content: '';
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #4ade80;
            display: inline-block;
        }
        .chat-close {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: none;
            background: rgba(255,255,255,0.15);
            color: #fff;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
        }
        .chat-close:hover { background: rgba(255,255,255,0.25); }

        /* Messages */
        .chat-msgs {
            flex: 1;
            overflow-y: auto;
            padding: 16px 14px 10px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #f8f9fe;
        }
        .chat-msgs::-webkit-scrollbar { width: 4px; }
        .chat-msgs::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

        .chat-msg-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            animation: msgIn 0.25s ease-out;
        }
        .chat-msg-row.user { flex-direction: row-reverse; }

        @keyframes msgIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .chat-msg-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.15rem;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .chat-msg-avatar.bot { background: rgba(102, 126, 234, 0.1); }
        .chat-msg-avatar.user { background: #e8eef5; }

        .chat-msg {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 0.85rem;
            line-height: 1.55;
            word-break: break-word;
            position: relative;
        }
        .chat-msg.user {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #fff;
            border-bottom-right-radius: 4px;
        }
        .chat-msg.bot {
            background: #fff;
            color: #333;
            border: 1px solid rgba(102, 126, 234, 0.15);
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .chat-msg.bot strong { font-weight: 600; color: #667eea; }
        .chat-msg.bot em { font-style: italic; color: #764ba2; }
        .chat-msg.bot code {
            background: rgba(102, 126, 234, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.8rem;
        }
        .chat-msg.bot br + br { display: none; }
        .chat-msg.bot .typing {
            display: inline-flex;
            gap: 3px;
        }
        .chat-msg.bot .typing span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #999;
            animation: load-dots 1s ease-in-out infinite;
        }
        .chat-msg.bot .typing span:nth-child(2) { animation-delay: 0.15s; }
        .chat-msg.bot .typing span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes load-dots {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
        }

        /* Input */
        .chat-input-row {
            display: flex;
            gap: 8px;
            padding: 10px 14px 14px;
            border-top: 1px solid rgba(102, 126, 234, 0.1);
            background: #fff;
            align-items: flex-end;
        }
        .chat-input {
            flex: 1;
            padding: 10px 14px;
            border: 1.5px solid #e0e0e0;
            border-radius: 12px;
            font-size: 0.85rem;
            font-family: inherit;
            background: #f8f9fe;
            color: #333;
            outline: none;
            transition: border-color 0.2s, background 0.2s;
            resize: none;
            line-height: 1.45;
            max-height: 100px;
            overflow-y: auto;
        }
        .chat-input:focus {
            border-color: #667eea;
            background: #fff;
        }
        .chat-input::placeholder { color: #999; }
        .chat-send {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #fff;
            cursor: pointer;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.15s;
        }
        .chat-send:hover { transform: translateY(-1px); }
        .chat-send:active { transform: scale(0.95); }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .chat-send svg { width: 16px; height: 16px; }

        /* 响应式 */
        @media (max-width: 480px) {
            .chat-panel { right: 12px; left: 12px; width: auto; bottom: 150px; max-height: 55vh; }
            .chat-btn { width: 100px; height: 100px; }
        }
    `;
    document.head.appendChild(style);

    // ---- Lottie 脚本加载 ----
    const lottieScript = document.createElement('script');
    lottieScript.type = 'module';
    lottieScript.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js';
    document.head.appendChild(lottieScript);

    // ---- HTML 结构 ----
    const btn = document.createElement('button');
    btn.className = 'chat-btn';
    btn.setAttribute('aria-label', '打开AI聊天');
    btn.innerHTML = '<dotlottie-wc src="./ai/chatbot.lottie" autoplay loop></dotlottie-wc>';

    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.id = 'chatPanel';
    panel.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-left">
                <div class="chat-header-avatar">M</div>
                <div class="chat-header-info">
                    <div class="chat-header-name">Mo小窝助手</div>
                    <div class="chat-header-status">在线</div>
                </div>
            </div>
            <button class="chat-close" id="chatCloseBtn">✕</button>
        </div>
        <div class="chat-msgs" id="chatMsgs">
            <div class="chat-msg-row bot">
                <div class="chat-msg-avatar bot">🤖</div>
                <div class="chat-msg bot">嗨～终于等到你啦！我是 Mo小窝的贴心小助手，有什么可以帮你的吗？😊</div>
            </div>
        </div>
        <div class="chat-input-row">
            <textarea class="chat-input" id="chatInput" placeholder="说点什么吧..." rows="1"></textarea>
            <button class="chat-send" id="chatSendBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // ---- 功能逻辑 ----
    const msgs = document.getElementById('chatMsgs');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const closeBtn = document.getElementById('chatCloseBtn');
    let chatSending = false;

    // 简单的 Markdown 转 HTML
    function renderMarkdown(text) {
        return text
            .replace(/\n{3,}/g, '\n\n')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    // 切换面板
    function toggleChat() {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            input.focus();
        }
    }

    closeBtn.addEventListener('click', toggleChat);

    // 添加消息
    function addChatMsg(text, role) {
        const row = document.createElement('div');
        row.className = 'chat-msg-row ' + role;
        const avatar = document.createElement('div');
        avatar.className = 'chat-msg-avatar ' + role;
        avatar.textContent = role === 'bot' ? '🤖' : '🧠';
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg ' + role;
        bubble.innerHTML = role === 'bot' ? renderMarkdown(text) : text;
        row.appendChild(avatar);
        row.appendChild(bubble);
        msgs.appendChild(row);
        row.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return bubble;
    }

    // 显示打字动画
    function showTyping() {
        const row = document.createElement('div');
        row.className = 'chat-msg-row bot';
        const avatar = document.createElement('div');
        avatar.className = 'chat-msg-avatar bot';
        avatar.textContent = '🤖';
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg bot';
        bubble.id = 'chatTyping';
        bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
        row.appendChild(avatar);
        row.appendChild(bubble);
        msgs.appendChild(row);
        row.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function hideTyping() {
        const el = document.getElementById('chatTyping');
        if (el) el.closest('.chat-msg-row').remove();
    }

    // 自动调整输入框高度
    function autoResize(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 100) + 'px';
    }

    input.addEventListener('input', function () { autoResize(this); });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });

    // 发送消息
    async function sendChat() {
        const msg = input.value.trim();
        if (!msg || chatSending) return;

        input.value = '';
        input.style.height = 'auto';
        chatSending = true;
        sendBtn.disabled = true;

        addChatMsg(msg, 'user');
        showTyping();

        try {
            // 获取音乐信息
            let musicInfo = null;
            if (window.currentMusic && typeof window.currentMusic.getInfo === 'function') {
                musicInfo = window.currentMusic.getInfo();
            }

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    currentPage: window.location.pathname,
                    pageTitle: document.title,
                    musicInfo: musicInfo,
                    stream: true
                })
            });

            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data.error || '请求失败');
            }

            if (!resp.body) {
                throw new Error('流式响应不可用');
            }

            // 复用打字气泡
            const typingEl = document.getElementById('chatTyping');
            if (typingEl) {
                typingEl.id = '';
                typingEl.innerHTML = '';
            }

            const bubble = typingEl || addChatMsg('', 'bot');
            const reader = resp.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const payload = trimmed.slice(5).trim();
                    if (!payload || payload === '[DONE]') continue;

                    try {
                        const json = JSON.parse(payload);
                        const delta = json?.choices?.[0]?.delta?.content;
                        if (delta) {
                            fullText += delta;
                            bubble.innerHTML = renderMarkdown(fullText);
                            msgs.scrollTop = msgs.scrollHeight;
                        }
                    } catch (e) {
                        // 忽略解析失败的碎片行
                    }
                }
            }

            if (!fullText.trim()) {
                bubble.innerHTML = '哎呀，这个问题把我难住了，要不换个话题聊聊？';
            }
        } catch (err) {
            hideTyping();
            addChatMsg('呜呜，我的小脑瓜短路了：' + (err.message || '等我休息一下再试好不好？'), 'bot');
            console.error(err);
        } finally {
            chatSending = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    sendBtn.addEventListener('click', sendChat);

    // ---- 拖拽功能 ----
    let isDragging = false;
    let hasDragged = false;
    let startX, startY, startBtnX, startBtnY;

    btn.addEventListener('mousedown', startDrag);
    btn.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        if (e.type === 'touchstart') e.preventDefault();
        isDragging = true;
        hasDragged = false;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        // 获取按钮当前位置
        const rect = btn.getBoundingClientRect();
        startBtnX = rect.left;
        startBtnY = rect.top;
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function onDrag(e) {
        if (!isDragging) return;
        if (e.type === 'touchmove') e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasDragged = true;
            // 计算新位置
            let newX = startBtnX + dx;
            let newY = startBtnY + dy;
            // 限制在窗口范围内
            const btnSize = 130;
            newX = Math.max(0, Math.min(window.innerWidth - btnSize, newX));
            newY = Math.max(0, Math.min(window.innerHeight - btnSize, newY));
            // 使用 left 和 top 定位
            btn.style.left = newX + 'px';
            btn.style.top = newY + 'px';
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
        }
    }

    function endDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
    }

    // 点击事件 - 区分拖拽和点击
    btn.addEventListener('click', function (e) {
        if (hasDragged) {
            hasDragged = false;
            return;
        }
        toggleChat();
    });
})();
