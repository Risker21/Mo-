/**
 * 认证 API 路由
 * 包含：注册、密码登录、发送验证码、验证码登录、获取用户信息、修改密码、忘记密码
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { getSupabase } = require('./_lib/supabase');
const { signToken, verifyToken } = require('./_lib/jwt');
const { sendMailCode } = require('./_lib/mail');

const router = express.Router();

// 辅助函数：统一 JSON 响应
function sendJson(res, status, data) {
  res.status(status).json(data);
}

// ---- 注册 ----
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, code } = req.body;
    if (!username || !email || !password || !code) {
      return sendJson(res, 400, { code: 400, msg: '请填写所有必填字段' });
    }
    if (username.length < 2 || username.length > 20) {
      return sendJson(res, 400, { code: 400, msg: '用户名需在 2-20 个字符之间' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(res, 400, { code: 400, msg: '邮箱格式不正确' });
    }
    if (!/^\d{6}$/.test(code)) {
      return sendJson(res, 400, { code: 400, msg: '验证码格式不正确' });
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password)) {
      return sendJson(res, 400, { code: 400, msg: '密码需至少 8 位，包含字母和数字' });
    }
    const supabase = getSupabase();

    // 验证邮箱验证码
    console.log(`[注册] 验证验证码: email=${email}, code=${code}, type=register`);
    const { data: codes, error: codeError } = await supabase.from('verification_codes')
      .select('*').eq('email', email).eq('code', code)
      .eq('type', 'register').eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1);

    if (codeError) {
      console.error('[注册] 查询验证码错误:', codeError);
      return sendJson(res, 500, { code: 500, msg: '验证码查询失败' });
    }

    console.log(`[注册] 查询到验证码: ${codes ? codes.length : 0} 条`);
    if (!codes || codes.length === 0) {
      // 查询是否有该邮箱的验证码（不过滤条件）
      const { data: allCodes } = await supabase.from('verification_codes')
        .select('*').eq('email', email)
        .order('created_at', { ascending: false }).limit(5);
      console.log(`[注册] 该邮箱所有验证码:`, allCodes);
      return sendJson(res, 401, { code: 401, msg: '验证码错误或已过期' });
    }
    await supabase.from('verification_codes').update({ used: true }).eq('id', codes[0].id);

    // 检查邮箱和用户名是否已被注册
    const { data: existing } = await supabase.from('users')
      .select('email,username')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);
    if (existing && existing.length > 0) {
      if (existing[0].email === email) {
        return sendJson(res, 409, { code: 409, msg: '该邮箱已被注册' });
      }
      return sendJson(res, 409, { code: 409, msg: '该用户名已被使用' });
    }

    // 创建用户
    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase.from('users')
      .insert({ email, username, password_hash })
      .select().single();
    if (error) throw error;

    const token = signToken({ sub: user.id, email: user.email, username: user.username });
    console.log(`[注册] ${username} <${email}> → ${user.id}`);
    sendJson(res, 200, {
      code: 200,
      data: { token, user: { id: user.id, email: user.email, username: user.username } }
    });
  } catch (e) {
    console.error('[注册] 错误:', e.message);
    sendJson(res, 500, { code: 500, msg: e.message });
  }
});

// ---- 密码登录 ----
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    if (!account || !password) {
      return sendJson(res, 400, { code: 400, msg: '请输入账号和密码' });
    }
    const supabase = getSupabase();

    // 自动判断是邮箱还是用户名
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account);
    const query = isEmail
      ? supabase.from('users').select('*').eq('email', account).limit(1).single()
      : supabase.from('users').select('*').eq('username', account).limit(1).single();

    const { data: user, error } = await query;
    if (error || !user || !user.password_hash) {
      return sendJson(res, 401, { code: 401, msg: '账号或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return sendJson(res, 401, { code: 401, msg: '账号或密码错误' });
    }

    const token = signToken({ sub: user.id, email: user.email, username: user.username });
    console.log(`[登录] ${user.username || user.email} → ${user.id}`);
    sendJson(res, 200, {
      code: 200,
      data: { token, user: { id: user.id, email: user.email, username: user.username } }
    });
  } catch (e) {
    console.error('[登录] 错误:', e.message);
    sendJson(res, 500, { code: 500, msg: e.message });
  }
});

// ---- 发送验证码 ----
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    const type = req.body.type || 'login';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(res, 400, { code: 400, msg: '邮箱格式不正确' });
    }
    const supabase = getSupabase();

    // 频率限制：60 秒内只能发送一次
    const { data: recent } = await supabase
      .from('verification_codes')
      .select('created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      const elapsed = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
      if (elapsed < 60) {
        return sendJson(res, 429, { code: 429, msg: '发送太频繁，请稍后再试' });
      }
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabase.from('verification_codes').insert({ email, code, type, expires_at: expiresAt });
    await sendMailCode(email, code);

    console.log(`[发送验证码] ${email} → ${code} (type: ${type})`);
    sendJson(res, 200, { code: 200, msg: '验证码已发送' });
  } catch (e) {
    console.error('[发送验证码] 错误:', e.message);
    sendJson(res, 502, { code: 502, msg: e.message });
  }
});

// ---- 验证码登录 ----
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return sendJson(res, 400, { code: 400, msg: '参数不完整' });
    }
    const supabase = getSupabase();

    // 验证验证码
    const { data: codes } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    if (!codes || codes.length === 0) {
      return sendJson(res, 401, { code: 401, msg: '验证码错误或已过期' });
    }
    await supabase.from('verification_codes').update({ used: true }).eq('id', codes[0].id);

    // Upsert 用户（不存在则创建，存在则更新）
    const now = new Date().toISOString();
    const { data: user, error: upsertErr } = await supabase
      .from('users')
      .upsert({ email, updated_at: now }, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single();
    if (upsertErr) throw upsertErr;

    const token = signToken({ sub: user.id, email: user.email });
    console.log(`[验证码登录] ${email} → 用户 ${user.id}`);
    sendJson(res, 200, {
      code: 200,
      data: { token, user: { id: user.id, email: user.email, username: user.username } }
    });
  } catch (e) {
    console.error('[验证码验证] 错误:', e.message);
    sendJson(res, 500, { code: 500, msg: e.message });
  }
});

// ---- 获取当前用户信息 ----
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return sendJson(res, 401, { code: 401, msg: '未登录' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return sendJson(res, 401, { code: 401, msg: '登录已过期，请重新登录' });
    }
    console.error('[me] 验证错误:', e.message);
    return sendJson(res, 500, { code: 500, msg: e.message });
  }

  try {
    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, password_hash, created_at')
      .eq('id', payload.sub)
      .single();
    if (error || !user) {
      return sendJson(res, 401, { code: 401, msg: '用户不存在' });
    }

    sendJson(res, 200, {
      code: 200,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          has_password: !!user.password_hash,
          created_at: user.created_at,
        }
      }
    });
  } catch (e) {
    console.error('[获取用户] 错误:', e.message);
    sendJson(res, 500, { code: 500, msg: e.message });
  }
});

// ---- 修改密码/用户名 ----
router.put('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return sendJson(res, 401, { code: 401, msg: '未登录' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return sendJson(res, 401, { code: 401, msg: '登录已过期，请重新登录' });
    }
    console.error('[me] 验证错误:', e.message);
    return sendJson(res, 500, { code: 500, msg: e.message });
  }

  try {
    const supabase = getSupabase();
    const { data: user, error } = await supabase.from('users').select('*').eq('id', payload.sub).single();
    if (error || !user) {
      return sendJson(res, 401, { code: 401, msg: '用户不存在' });
    }

    const { oldPassword, newPassword, username } = req.body;
    const updates = {};

    // 更新用户名
    if (username !== undefined) {
      if (typeof username !== 'string' || username.length < 2 || username.length > 20) {
        return sendJson(res, 400, { code: 400, msg: '用户名需 2-20 个字符' });
      }
      const { data: dup } = await supabase.from('users')
        .select('id').eq('username', username).neq('id', payload.sub).limit(1);
      if (dup && dup.length > 0) {
        return sendJson(res, 400, { code: 400, msg: '用户名已被占用' });
      }
      updates.username = username;
    }

    // 设置/修改密码
    if (newPassword) {
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(newPassword)) {
        return sendJson(res, 400, { code: 400, msg: '密码需至少 8 位，包含字母和数字' });
      }
      if (user.password_hash) {
        if (!oldPassword) {
          return sendJson(res, 400, { code: 400, msg: '请提供原密码' });
        }
        const valid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!valid) {
          return sendJson(res, 401, { code: 401, msg: '原密码错误' });
        }
      }
      updates.password_hash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return sendJson(res, 400, { code: 400, msg: '没有需要修改的内容' });
    }

    updates.updated_at = new Date().toISOString();
    await supabase.from('users').update(updates).eq('id', payload.sub);

    const newToken = signToken({
      sub: user.id,
      email: user.email,
      username: updates.username || user.username
    });
    console.log(`[更新用户] ${payload.sub} → ${Object.keys(updates).join(', ')}`);
    sendJson(res, 200, { code: 200, msg: '已更新', data: { token: newToken } });
  } catch (e) {
    console.error('[更新用户] 错误:', e.message);
    sendJson(res, 500, { code: 500, msg: e.message });
  }
});

// ---- 忘记密码 ----
router.post('/password-reset', async (req, res) => {
  try {
    const { action, email, code, password } = req.body;

    // 发送重置验证码
    if (action === 'send') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { code: 400, msg: '邮箱格式不正确' });
      }
      const supabase = getSupabase();

      // 检查用户是否存在
      const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
      if (!user) {
        // 为了安全，不暴露邮箱是否注册
        return sendJson(res, 200, { code: 200, msg: '如果该邮箱已注册，验证码已发送' });
      }

      // 频率限制
      const { data: recent } = await supabase.from('verification_codes')
        .select('created_at')
        .eq('email', email)
        .eq('type', 'password_reset')
        .order('created_at', { ascending: false })
        .limit(1);
      if (recent && recent.length > 0) {
        const elapsed = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
        if (elapsed < 60) {
          return sendJson(res, 429, { code: 429, msg: '发送太频繁，请稍后再试' });
        }
      }

      const sendCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await supabase.from('verification_codes').insert({
        email, code: sendCode, type: 'password_reset', expires_at: expiresAt
      });
      await sendMailCode(email, sendCode);

      console.log(`[密码重置] ${email} → 验证码已发送`);
      return sendJson(res, 200, { code: 200, msg: '如果该邮箱已注册，验证码已发送' });
    }

    // 重置密码
    if (action === 'reset') {
      if (!email || !code || !password) {
        return sendJson(res, 400, { code: 400, msg: '参数不完整' });
      }
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password)) {
        return sendJson(res, 400, { code: 400, msg: '密码需至少 8 位，包含字母和数字' });
      }

      const supabase = getSupabase();
      const { data: codes } = await supabase.from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('type', 'password_reset')
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      if (!codes || codes.length === 0) {
        return sendJson(res, 401, { code: 401, msg: '验证码错误或已过期' });
      }

      await supabase.from('verification_codes').update({ used: true }).eq('id', codes[0].id);
      const password_hash = await bcrypt.hash(password, 10);
      await supabase.from('users')
        .update({ password_hash, updated_at: new Date().toISOString() })
        .eq('email', email);

      console.log(`[密码重置] ${email}`);
      return sendJson(res, 200, { code: 200, msg: '密码已重置，请重新登录' });
    }

    sendJson(res, 400, { code: 400, msg: '无效的 action' });
  } catch (e) {
    console.error('[密码重置] 错误:', e.message);
    sendJson(res, 500, { code: 500, msg: e.message });
  }
});

module.exports = router;
