const nodemailer = require('nodemailer');

/** Hostnames that must never be used for real delivery (docs / examples only). */
const PLACEHOLDER_SMTP_HOSTS = new Set(
  ['', 'smtp.example.com', 'example.com', 'mail.example.com'].map((h) => h.toLowerCase())
);

function getBaseUrl() {
  return (
    process.env.PUBLIC_SITE_URL ||
    `http://localhost:${process.env.WEBSITE_PORT || process.env.PORT || 3000}`
  ).replace(/\/$/, '');
}

function getSmtpHost() {
  return String(process.env.SMTP_HOST || '').trim();
}

function isSmtpConfigured() {
  const host = getSmtpHost().toLowerCase();
  if (!host) return false;
  if (PLACEHOLDER_SMTP_HOSTS.has(host)) return false;
  return true;
}

function createTransport() {
  if (!isSmtpConfigured()) return null;
  const host = getSmtpHost();
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
  const rawHost = getSmtpHost();

  if (!rawHost) {
    console.warn('[mail] SMTP_HOST is empty — email not sent to', to);
    return { skipped: true };
  }
  if (PLACEHOLDER_SMTP_HOSTS.has(rawHost.toLowerCase())) {
    console.warn(
      '[mail] SMTP_HOST is a placeholder (' +
        rawHost +
        '). Set a real server (e.g. Gmail, SendGrid, Resend, Mailgun). Email not sent to',
      to
    );
    return { skipped: true };
  }

  const transporter = createTransport();
  if (!transporter) {
    return { skipped: true };
  }

  try {
    await transporter.sendMail({ from, to, subject, text, html: html || text });
    return { sent: true };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error(
      '[mail] Send failed to',
      to + ':',
      msg,
      '| Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and firewall/DNS.'
    );
    return { sent: false, error: msg };
  }
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
