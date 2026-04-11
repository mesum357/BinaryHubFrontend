const nodemailer = require('nodemailer');

function getBaseUrl() {
  return (
    process.env.PUBLIC_SITE_URL ||
    `http://localhost:${process.env.WEBSITE_PORT || process.env.PORT || 3000}`
  ).replace(/\/$/, '');
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_PORT === '465',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
  });
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@binaryhub.pk';
  const transporter = createTransport();
  if (!transporter) {
    console.warn('[mail] SMTP_HOST not set; skipping email to', to);
    return { skipped: true };
  }
  await transporter.sendMail({ from, to, subject, text, html: html || text });
  return { sent: true };
}

function sendVerificationEmail(to, name, token) {
  const base = getBaseUrl();
  const link = `${base}/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendMail({
    to,
    subject: 'Verify your Binary Hub account',
    text: `Hi ${name},\n\nVerify your email: ${link}\n\nThis link expires in 48 hours.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p><a href="${link}">Verify your email</a></p><p>This link expires in 48 hours.</p>`
  });
}

function sendPasswordResetEmail(to, name, token) {
  const base = getBaseUrl();
  const link = `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to,
    subject: 'Reset your Binary Hub password',
    text: `Hi ${name},\n\nReset password: ${link}\n\nThis link expires in 1 hour.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 1 hour.</p>`
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  getBaseUrl,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMail
};
