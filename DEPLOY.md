# Mo小窝 - Netlify 部署指南

## 一、准备工作

### 1.1 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 记录以下信息（Settings → API）：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role Key**: 以 `eyJ...` 开头的长字符串

### 1.2 创建数据库表

1. 在 Supabase 控制台进入 SQL Editor
2. 复制 `supabase-schema.sql` 文件的内容并执行
3. 确认 `users` 和 `verification_codes` 表已创建

### 1.3 准备环境变量

你需要准备以下环境变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service_role 密钥 |
| `JWT_SECRET` | ✅ | JWT 签名密钥（至少 32 位随机字符串） |
| `AI_API_KEY` | ❌ | AI 聊天 API 密钥 |
| `AI_MODEL` | ❌ | AI 模型名称，默认 `gpt-4o-mini` |
| `AI_BASE_URL` | ❌ | AI API 地址，默认 OpenAI |
| `MAIL_HOST` | ❌ | SMTP 服务器地址 |
| `MAIL_PORT` | ❌ | SMTP 端口，默认 465 |
| `MAIL_USER` | ❌ | SMTP 用户名 |
| `MAIL_PASS` | ❌ | SMTP 密码 |
| `MAIL_FROM_NAME` | ❌ | 邮件发件人名称 |

**注意**：
- `JWT_SECRET` 可以使用以下命令生成随机字符串：
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- 未配置 SMTP 时，验证码会打印到 Netlify Functions 日志中（开发模式）

---

## 二、部署到 Netlify

### 2.1 方式一：Git 部署（推荐）

1. 将代码推送到 GitHub/GitLab 仓库
2. 登录 [https://app.netlify.com](https://app.netlify.com)
3. 点击 "Add new site" → "Import an existing project"
4. 选择你的 Git 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.`（项目根目录）
6. 点击 "Deploy site"

### 2.2 方式二：手动部署

1. 在项目根目录运行：
   ```bash
   npm install
   ```
2. 登录 Netlify，点击 "Add new site" → "Deploy manually"
3. 将整个项目文件夹拖拽到部署区域

### 2.3 配置环境变量

1. 在 Netlify 控制台进入 Site settings → Environment variables
2. 添加以下环境变量：
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret_at_least_32_chars
   AI_API_KEY=your_ai_api_key
   ```
3. 如果需要邮件功能，还需添加 SMTP 相关变量

### 2.4 触发重新部署

添加环境变量后，需要触发一次重新部署：
- 进入 Deploys 页面
- 点击 "Trigger deploy" → "Deploy site"

---

## 三、本地开发

### 3.1 安装依赖

```bash
cd mo
npm install
```

### 3.2 创建 .env 文件

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的环境变量。

### 3.3 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:8888` 测试。

**注意**：本地开发时，验证码会打印到控制台（因为未配置 SMTP）。

---

## 四、功能说明

### 4.1 登录方式

- **密码登录**：用户名/邮箱 + 密码
- **验证码登录**：邮箱 + 6位验证码（未配置 SMTP 时验证码在控制台）
- **游客模式**：无需登录，但功能受限

### 4.2 注册流程

1. 点击"立即注册"
2. 输入用户名、邮箱
3. 点击"发送验证码"
4. 输入验证码和密码
5. 点击"注册"

### 4.3 忘记密码

1. 点击"忘记密码"
2. 输入邮箱，点击"发送验证码"
3. 输入验证码和新密码
4. 点击"重置密码"

### 4.4 AI 聊天

- 需要配置 `AI_API_KEY` 才能使用
- 支持任何 OpenAI 兼容的 API
- 每 IP 每分钟最多 10 个请求

---

## 五、自定义域名

如果要使用自定义域名（如 `momo21.online`）：

1. 在 Netlify 控制台进入 Domain management
2. 点击 "Add custom domain"
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

---

## 六、常见问题

### Q1: 验证码收不到？

A: 检查以下几点：
- 是否配置了 SMTP 环境变量
- 检查 Netlify Functions 日志，验证码可能打印在那里
- 检查垃圾邮件文件夹

### Q2: 登录后页面空白？

A: 可能是 token 过期或无效，尝试：
- 清除浏览器 localStorage
- 重新登录

### Q3: AI 聊天不工作？

A: 检查以下几点：
- 是否配置了 `AI_API_KEY`
- API 地址是否正确
- 检查 Netlify Functions 日志中的错误信息

### Q4: 如何查看 Functions 日志？

A: 在 Netlify 控制台进入 Functions 页面，点击对应的函数即可查看日志。

---

## 七、安全建议

1. **JWT_SECRET** 必须使用强密钥（至少 32 位随机字符串）
2. **SUPABASE_SERVICE_KEY** 是服务端密钥，不要暴露给前端
3. 生产环境建议配置 SMTP 服务，而不是使用开发模式
4. 定期更新依赖包以修复安全漏洞

---

## 八、文件结构

```
mo/
├── package.json              # Node.js 依赖配置
├── netlify.toml              # Netlify 部署配置
├── .env.example              # 环境变量示例
├── server.js                 # Express 主服务
├── supabase-schema.sql       # 数据库表结构
├── DEPLOY.md                 # 本文档
├── api/
│   ├── _lib/
│   │   ├── supabase.js       # Supabase 客户端
│   │   ├── jwt.js            # JWT 工具
│   │   └── mail.js           # 邮件服务
│   ├── auth.js               # 认证 API 路由
│   ├── chat.js               # AI 聊天知识库
│   └── site-knowledge.js     # AI 系统提示词
├── netlify/
│   └── functions/
│       └── api.js            # Netlify Functions 入口
├── login_in/
│   ├── login.html            # 登录页面
│   ├── index.html            # 主站页面
│   ├── js/
│   │   ├── auth.js           # 前端认证模块
│   │   └── ...               # 其他脚本
│   └── css/
│       └── ...               # 样式文件
└── ...                       # 其他静态资源
```
