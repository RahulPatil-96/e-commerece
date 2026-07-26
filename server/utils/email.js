import nodemailer from 'nodemailer';

const smtpUrl = process.env.SMTP_URL;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailerFrom = process.env.MAILER_FROM || 'no-reply@lekha.com';

let transporter = null;

if (smtpUrl) {
  transporter = nodemailer.createTransport(smtpUrl);
} else if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort) || 587,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn(`Email delivery disabled; no SMTP credentials configured. Skipping email to ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: mailerFrom,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
