/**
 * Email Service — Nodemailer transporter for OTP verification emails.
 *
 * Uses Gmail SMTP by default. Configure via:
 *   EMAIL_USER — Gmail address
 *   EMAIL_PASS — Gmail App Password (16 chars, NOT your Gmail password)
 *
 * To switch to Resend/SendGrid, change the transporter config below.
 */

const nodemailer = require('nodemailer');

// ── Create reusable transporter ─────────────────────────────────────────────

const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Mailer] EMAIL_USER or EMAIL_PASS not set — email verification will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// ── Generate 6-digit OTP ────────────────────────────────────────────────────

const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// ── Send verification OTP email ─────────────────────────────────────────────

const sendVerificationOTP = async (email, otp, userName = '') => {
  const transport = getTransporter();

  if (!transport) {
    console.warn(`[Mailer] Skipping OTP email to ${email} — no transporter configured.`);
    return { sent: false, reason: 'no_transporter' };
  }

  const mailOptions = {
    from: `"NextRound" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your NextRound account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px 16px; border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px; font-weight: 800; color: white;">NextRound</span>
          </div>
          <h2 style="color: #f8fafc; font-size: 20px; margin: 0;">Verify your email</h2>
        </div>

        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Hi${userName ? ` ${userName}` : ''},<br/>
          Enter this code to verify your email and activate your NextRound account:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #1e293b; border: 2px solid #6366f1; border-radius: 12px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #6366f1; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center;">
          This code expires in <strong style="color: #94a3b8;">10 minutes</strong>.<br/>
          If you didn't create an account, ignore this email.
        </p>

        <div style="border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; text-align: center;">
          <span style="color: #475569; font-size: 11px;">NextRound — AI Mock Interview & Resume Analyzer</span>
        </div>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.log(`[Mailer] OTP sent to ${email}`);
    return { sent: true };
  } catch (error) {
    console.error(`[Mailer] Failed to send OTP to ${email}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

module.exports = { generateOTP, sendVerificationOTP };
