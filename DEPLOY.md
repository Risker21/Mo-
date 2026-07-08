# Mo小窝

个人创意前端展示网站，集成了登录认证、AI 聊天、互动游戏等模块。

## 技术栈

- **前端**：原生 HTML/CSS/JS，部分页面使用 GSAP、Three.js、Swiper 等库
- **后端**：Express.js（Node.js），部署为 Netlify Functions
- **数据库**：Supabase（PostgreSQL）
- **认证**：JWT + 邮箱验证码（SMTP / 控制台输出）
- **验证码**：星空云 API（需配置 API_ID / API_KEY）

## 部署（Netlify）

1. 将代码推送到 GitHub
2. 在 Netlify 导入仓库，保持默认构建配置
3. 在 **Site settings → Environment variables** 添加以下变量：

   | 变量 | 说明 |
   |------|------|
   | `SUPABASE_URL` | Supabase 项目 URL |
   | `SUPABASE_SERVICE_KEY` | Supabase 服务端密钥 |
   | `JWT_SECRET` | JWT 签名密钥（32+ 位随机字符） |
   | `API_ID` | 星空云验证码 ID |
   | `API_KEY` | 星空云验证码 Key |

4. 执行 `supabase-schema.sql` 创建数据库表
5. 触发重新部署

## 本地开发

```bash
npm install
cp .env.example .env   # 填写配置
npm run dev            # http://localhost:8888
```
