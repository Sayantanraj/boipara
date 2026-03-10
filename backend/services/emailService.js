const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  debug: true,
  logger: true
});

const sendOTPEmail = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'BOI PARA - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C1810;">Welcome to BOI PARA!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for signing up with BOI PARA. Please verify your email address using the OTP below:</p>
          <div style="background: #F5E6D3; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #8B6F47; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <p>Best regards,<br>BOI PARA Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const sendResetPasswordOTP = async (email, name, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password - BOI PARA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Reset Your Password</h2>
          <p>Hello ${name},</p>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2C1810; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>BOI PARA Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Reset password email sending failed:', error);
    throw error;
  }
};

module.exports = { sendOTPEmail, sendResetPasswordOTP };