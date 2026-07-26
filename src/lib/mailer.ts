import nodemailer from "nodemailer";

// Sends the 6-digit registration code through the configured QQ mailbox.
export async function sendVerificationCode(
  to: string,
  code: string
): Promise<void> {
  const host = process.env.SMTP_HOST ?? "smtp.qq.com";
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.QQ_EMAIL;
  const pass = process.env.QQ_EMAIL_AUTH_CODE;
  if (!user || !pass) {
    throw new Error("QQ_EMAIL / QQ_EMAIL_AUTH_CODE are not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"黎安拼车 Li'an Carpool" <${user}>`,
    to,
    subject: `【黎安拼车】注册验证码 ${code} / Verification Code`,
    text: `你的注册验证码是 ${code},10 分钟内有效。如果这不是你的操作,请忽略本邮件。\n\nYour verification code is ${code}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
  <h2 style="color:#333">黎安拼车 · Li'an Carpool</h2>
  <p>你的注册验证码 / Your verification code:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#6344F5">${code}</p>
  <p style="color:#888">10 分钟内有效。如果这不是你的操作,请忽略本邮件。<br/>Expires in 10 minutes. If you did not request this, please ignore this email.</p>
</div>`,
  });
}
