// @ts-nocheck
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const FROM = `NexTalk <${process.env.EMAIL_FROM || "noreply@nextalk.app"}>`;
const BASE = process.env.NEXTAUTH_URL || "http://localhost:3000";

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NexTalk</title>
  <style>
    body { margin: 0; padding: 0; background: #090e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #161b2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #4140ca, #6271f1); padding: 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 800; color: white; letter-spacing: -1px; }
    .logo span { color: #a5bbfc; }
    .body { padding: 40px; color: #cdd4e6; line-height: 1.6; }
    h1 { color: #f8f9fc; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { margin: 0 0 16px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f52e5, #6271f1); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .code { background: #1d1d4d; border: 1px solid rgba(98,113,241,0.3); border-radius: 8px; padding: 16px 24px; font-size: 28px; font-weight: 800; color: #a5bbfc; letter-spacing: 4px; text-align: center; margin: 16px 0; font-family: monospace; }
    .muted { color: #8d9fbe; font-size: 13px; }
    .footer { padding: 24px 40px; text-align: center; color: #576788; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">Nex<span>Talk</span></div>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        © ${new Date().getFullYear()} NexTalk. All rights reserved.<br/>
        <span class="muted">You received this email because you have an account on NexTalk.</span>
      </div>
    </div>
  </div>
</body>
</html>`;

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const url = `${BASE}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your NexTalk email",
    html: baseTemplate(`
      <h1>Welcome to NexTalk, ${name}! 👋</h1>
      <p>You're one step away from joining the conversation. Please verify your email address to activate your account.</p>
      <div style="text-align:center;">
        <a href="${url}" class="btn">Verify Email Address</a>
      </div>
      <div class="divider"></div>
      <p class="muted">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const url = `${BASE}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your NexTalk password",
    html: baseTemplate(`
      <h1>Reset your password</h1>
      <p>Hi ${name}, we received a request to reset your NexTalk password.</p>
      <div style="text-align:center;">
        <a href="${url}" class="btn">Reset Password</a>
      </div>
      <div class="divider"></div>
      <p class="muted">This link expires in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `),
  });
}

export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  roomName: string,
  inviteCode: string
) {
  const url = `${BASE}/invite/${inviteCode}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `${inviterName} invited you to join ${roomName} on NexTalk`,
    html: baseTemplate(`
      <h1>You've been invited! 🎉</h1>
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${roomName}</strong> room on NexTalk.</p>
      <div style="text-align:center;">
        <a href="${url}" class="btn">Accept Invitation</a>
      </div>
      <div class="divider"></div>
      <p class="muted">This invitation expires in 7 days.</p>
    `),
  });
}

export async function sendTwoFactorEmail(email: string, code: string, name: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Your NexTalk login code",
    html: baseTemplate(`
      <h1>Your login code</h1>
      <p>Hi ${name}, use this code to complete your login:</p>
      <div class="code">${code}</div>
      <p class="muted">This code expires in 10 minutes. Never share it with anyone.</p>
    `),
  });
}

export async function sendWelcomeEmail(email: string, name: string, username: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Welcome to NexTalk — Your account is ready",
    html: baseTemplate(`
      <h1>Welcome aboard, ${name}! 🚀</h1>
      <p>Your NexTalk account is now active. Here's your username:</p>
      <div class="code" style="font-size:20px; letter-spacing:2px;">@${username}</div>
      <p>Start chatting, create rooms, and connect with people!</p>
      <div style="text-align:center;">
        <a href="${BASE}/chat" class="btn">Start Chatting</a>
      </div>
    `),
  });
}
