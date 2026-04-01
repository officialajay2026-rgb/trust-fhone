import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

// Create transporter - uses env vars if available, otherwise logs
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  }
  return null;
};

// Send notification (in-app + email if configured)
export const sendNotification = async ({ userId, type, title, message, link = '', email = '' }) => {
  // Always create in-app notification
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link
  });

  // Try sending email if SMTP is configured
  const transporter = getTransporter();
  if (transporter && email) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"TrustFhone Delhi" <noreply@trustfhone.com>',
        to: email,
        subject: title,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
            <h2 style="color:#a78bfa;">${title}</h2>
            <p style="color:#cbd5e1;line-height:1.6;">${message}</p>
            ${link ? `<a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border-radius:8px;text-decoration:none;">View Details</a>` : ''}
            <hr style="border:none;border-top:1px solid #334155;margin:24px 0;" />
            <p style="color:#64748b;font-size:12px;">TrustFhone Delhi - AI-Verified Mobile Marketplace</p>
          </div>
        `
      });
      notification.emailSent = true;
      await notification.save();
      console.log(`Email sent to ${email}: ${title}`);
    } catch (err) {
      console.log(`Email delivery skipped (SMTP not configured): ${title} -> ${email}`);
    }
  } else {
    console.log(`In-app notification created: ${title} for user ${userId}`);
  }

  return notification;
};
