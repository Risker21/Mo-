/**
 * 邮件验证码发送工具（直接通过 SMTP 发送，使用 nodemailer）
 */
const nodemailer = require('nodemailer');

const DEV_MODE = !process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS;

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10) || 465,
    secure: (parseInt(process.env.MAIL_PORT, 10) || 465) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

async function sendMailCode(email, code) {
  if (DEV_MODE) {
    console.log(`[DEV] 验证码 ${code} 已发送到 ${email}`);
    return { success: true };
  }

  const transporter = createTransport();
  const fromName = process.env.MAIL_FROM_NAME || 'Mo小窝';
  const fromAddr = process.env.MAIL_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: email,
    subject: 'Mo小窝验证码',
    text: `您的验证码是：${code}，5分钟内有效。如非本人操作，请忽略此邮件。`,
    html: `
      <div style="max-width:600px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;background:#f9f9f9;border-radius:8px;">
        <div style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);padding:30px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Mo小窝</h1>
        </div>
        <div style="background:#fff;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size:16px;color:#333;">您好！</p>
          <p style="font-size:16px;color:#333;">欢迎来到Mo小窝，您的验证码如下：</p>
          <div style="text-align:center;margin:30px 0;">
            <div style="display:inline-block;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;font-size:36px;font-weight:bold;letter-spacing:8px;padding:15px 30px;border-radius:8px;">
              ${code}
            </div>
          </div>
          <p style="font-size:14px;color:#999;">验证码5分钟内有效，如非本人操作，请忽略此邮件。</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:12px;color:#bbb;text-align:center;">本邮件由系统自动发送，请勿回复</p>
        </div>
      </div>
    `,
  });

  console.log(`[MAIL] 验证码已发送到 ${email}, messageId=${info.messageId}`);
  return { success: true };
}

module.exports = { sendMailCode };
