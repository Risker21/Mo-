// CAPTCHA 验证码组件（星空云 API）
class CaptchaWidget {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.md5key = '';
    this.imgEl = null;
    this.inputEl = null;
    this.errorEl = null;
  }

  // 获取新的验证码图片 + md5key
  async refresh() {
    try {
      console.log('[CAPTCHA] 开始获取验证码...');
      const res = await fetch('/api/captcha/get');
      console.log('[CAPTCHA] 响应状态:', res.status);
      const data = await res.json();
      console.log('[CAPTCHA] 返回数据:', JSON.stringify(data));

      if (data.code !== 200) {
        throw new Error(data.msg || '获取失败');
      }

      this.md5key = data.md5key;
      console.log('[CAPTCHA] md5key:', this.md5key);
      console.log('[CAPTCHA] imgurl:', data.imgurl);

      if (this.imgEl && data.imgurl) {
        // 使用代理加载图片
        const proxyUrl = '/api/captcha/image?url=' + encodeURIComponent(data.imgurl);
        console.log('[CAPTCHA] 代理URL:', proxyUrl);
        this.imgEl.src = proxyUrl;

        // 图片加载错误处理
        this.imgEl.onerror = () => {
          console.error('[CAPTCHA] 图片加载失败，尝试直接加载');
          this.imgEl.src = data.imgurl;
        };
      }
      if (this.inputEl) this.inputEl.value = '';
      if (this.errorEl) this.errorEl.textContent = '';
    } catch (e) {
      this.showError('验证码加载失败');
      console.error('[CAPTCHA] 错误:', e.message, e);
    }
  }

  // 验证用户输入的验证码
  async verify() {
    const code = this.inputEl?.value?.trim();
    if (!code) {
      this.showError('请输入验证码');
      return false;
    }
    if (!this.md5key) {
      this.showError('验证码未加载，请刷新');
      return false;
    }
    try {
      const res = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, md5key: this.md5key }),
      });
      const data = await res.json();
      if (data.code !== 200) {
        this.showError('验证码错误');
        this.refresh();
        return false;
      }
      return true;
    } catch (e) {
      this.showError('验证失败，请重试');
      this.refresh();
      return false;
    }
  }

  // 渲染组件到容器
  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="captcha-wrap">
        <div class="captcha-row">
          <img class="captcha-img" id="${this.containerId}_img" alt="验证码" title="点击刷新">
          <input class="captcha-input" id="${this.containerId}_input" placeholder="输入4位数字" maxlength="4" inputmode="numeric" autocomplete="off">
          <button class="captcha-refresh" id="${this.containerId}_refresh" type="button">换一张</button>
        </div>
        <div class="captcha-hint">↟↟↟ 依次输入图中4个区域内实心五角星数量 ↟↟↟</div>
        <div class="captcha-err" id="${this.containerId}_err"></div>
      </div>
    `;
    this.imgEl = document.getElementById(`${this.containerId}_img`);
    this.inputEl = document.getElementById(`${this.containerId}_input`);
    this.errorEl = document.getElementById(`${this.containerId}_err`);

    // 点击图片刷新
    this.imgEl.addEventListener('click', () => this.refresh());
    // 刷新按钮
    document.getElementById(`${this.containerId}_refresh`).addEventListener('click', (e) => {
      e.preventDefault();
      this.refresh();
    });

    this.refresh();
  }

  // 清空并刷新
  reset() {
    if (this.inputEl) this.inputEl.value = '';
    if (this.errorEl) this.errorEl.textContent = '';
    this.refresh();
  }

  showError(msg) {
    if (this.errorEl) this.errorEl.textContent = msg;
  }
}
