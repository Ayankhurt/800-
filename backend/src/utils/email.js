// Email utility
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { verificationEmailHTML } from "./emailTemplates.js";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* CURSOR PATCH START */

export async function sendEmailVerification(fullName, email, verifyUrl) {
  const html = verificationEmailHTML(fullName, verifyUrl);

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your BidRoom account",
    html,
  });
}

// Send MFA Backup Code email
export async function sendMfaResetEmail(name, email, resetCode) {
  const html = `
    <html>
    <body style="font-family: Arial; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; padding:30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563EB;">MFA Reset Request</h2>
        <p>Hello ${name || "there"},</p>
        <p>We received a request to disable Two-Factor Authentication (MFA) for your BidRoom account.</p>
        <p>Your MFA reset backup code is:</p>
        <div style="background: #F1F5F9; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0F172A; margin: 20px 0;">
          ${resetCode}
        </div>
        <p>Enter this code on the login screen to disable MFA and gain access to your account.</p>
        <p><b>Note:</b> This code will expire in 15 minutes. If you did not request this, please ignore this email and ensure your account is secure.</p>
      </div>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "MFA Reset Backup Code - BidRoom",
    html,
  });
}
/* CURSOR PATCH END */

// Send OTP email for MFA
export async function sendOtpEmail(name, email, otp) {
  const html = `
    <html>
    <body style="font-family: Arial; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; padding:30px;">
        <h2>Your BidRoom Login OTP</h2>
        <p>Hello ${name || "there"},</p>
        <p>Your login OTP is: <b>${otp}</b></p>
        <p>Valid for 10 minutes.</p>
      </div>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your BidRoom Login OTP",
    html,
  });
}
