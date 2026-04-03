import '../config/env.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
    : undefined,
});

export const sendPasswordResetEmail = async (to, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password/${token}`;
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TradeZella" <noreply@tradezella.com>',
    to,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click the link below to reset your password:</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>This link will expire in 1 hour.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Password reset email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Could not send password reset email.');
  }
};
