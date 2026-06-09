-- ========================================
-- Mo小窝 - Supabase 表结构
-- ========================================
-- 在 Supabase 控制台的 SQL Editor 中执行此文件

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- 2. 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'login',
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_email_code ON verification_codes (email, code);
CREATE INDEX IF NOT EXISTS idx_vc_email_created ON verification_codes (email, created_at DESC);
