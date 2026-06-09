/**
 * Mo小窝 - 前端认证模块
 * 包含：登录、注册、验证码、忘记密码等功能
 */

// ---- 全局状态 ----
let currentUser = null;
let userHasPassword = false;

// ---- Token 管理 ----
function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  localStorage.setItem('auth_token', token);
}

function removeToken() {
  localStorage.removeItem('auth_token');
}

// ---- API 请求封装 ----
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  return response.json();
}

// ---- 检查登录状态 ----
async function checkAuth() {
  const token = getToken();
  if (!token) return false;

  try {
    const data = await authFetch('/api/auth/me');
    if (data.code === 200) {
      currentUser = data.data.user;
      userHasPassword = !!data.data.user.has_password;
      return true;
    } else {
      removeToken();
      return false;
    }
  } catch (e) {
    console.error('[checkAuth] 错误:', e);
    return false;
  }
}

// ---- 密码登录 ----
async function loginWithPassword(account, password) {
  try {
    const data = await authFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account, password }),
    });

    if (data.code === 200) {
      setToken(data.data.token);
      currentUser = data.data.user;
      return { success: true };
    } else {
      return { success: false, msg: data.msg || '登录失败' };
    }
  } catch (e) {
    console.error('[loginWithPassword] 错误:', e);
    return { success: false, msg: '网络错误，请稍后重试' };
  }
}

// ---- 发送验证码 ----
async function sendVerifyCode(email, type = 'login') {
  try {
    const data = await authFetch('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email, type }),
    });

    if (data.code === 200) {
      return { success: true };
    } else {
      return { success: false, msg: data.msg || '发送失败' };
    }
  } catch (e) {
    console.error('[sendVerifyCode] 错误:', e);
    return { success: false, msg: '网络错误，请稍后重试' };
  }
}

// ---- 验证码登录 ----
async function loginWithCode(email, code) {
  try {
    const data = await authFetch('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });

    if (data.code === 200) {
      setToken(data.data.token);
      currentUser = data.data.user;
      return { success: true };
    } else {
      return { success: false, msg: data.msg || '验证失败' };
    }
  } catch (e) {
    console.error('[loginWithCode] 错误:', e);
    return { success: false, msg: '网络错误，请稍后重试' };
  }
}

// ---- 注册 ----
async function register(username, email, code, password) {
  try {
    const data = await authFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, code, password }),
    });

    if (data.code === 200) {
      setToken(data.data.token);
      currentUser = data.data.user;
      return { success: true };
    } else {
      return { success: false, msg: data.msg || '注册失败' };
    }
  } catch (e) {
    console.error('[register] 错误:', e);
    return { success: false, msg: '网络错误，请稍后重试' };
  }
}

// ---- 忘记密码 - 发送验证码 ----
async function sendResetCode(email) {
  try {
    const data = await authFetch('/api/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ action: 'send', email }),
    });

    if (data.code === 200) {
      return { success: true };
    } else {
      return { success: false, msg: data.msg || '发送失败' };
    }
  } catch (e) {
    console.error('[sendResetCode] 错误:', e);
    return { success: false, msg: '网络错误，请稍后重试' };
  }
}

// ---- 忘记密码 - 重置密码 ----
async function resetPassword(email, code, password) {
  try {
    const data = await authFetch('/api/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset', email, code, password }),
    });

    if (data.code === 200) {
      return { success: true };
    } else {
      return { success: false, msg: data.msg || '重置失败' };
    }
  } catch (e) {
    console.error('[resetPassword] 错误:', e);
    return { success: false, msg: '网络错误，请稍后重试' };
  }
}

// ---- 登出 ----
function logout() {
  removeToken();
  currentUser = null;
  userHasPassword = false;
}

// ---- 倒计时管理 ----
class CountdownTimer {
  constructor(buttonElement, seconds = 60) {
    this.btn = buttonElement;
    this.seconds = seconds;
    this.remaining = 0;
    this.timer = null;
    this.originalText = this.btn.textContent;
  }

  start() {
    this.remaining = this.seconds;
    this.btn.disabled = true;
    this.btn.textContent = `${this.remaining}秒后重试`;

    this.timer = setInterval(() => {
      this.remaining--;
      if (this.remaining <= 0) {
        this.stop();
      } else {
        this.btn.textContent = `${this.remaining}秒后重试`;
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.remaining = 0;
    this.btn.disabled = false;
    this.btn.textContent = this.originalText;
  }
}

// ---- 工具函数 ----
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
}

function isValidUsername(username) {
  return username.length >= 2 && username.length <= 20;
}

function isValidCode(code) {
  return /^\d{6}$/.test(code);
}
