const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');
const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer', phone, location, storeName, storeAddress } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      location,
      ...(role === 'seller' && { storeName, storeAddress }),
      emailOTP: otp,
      otpExpires,
      isEmailVerified: false
    });

    await user.save();
    await emailService.sendOTPEmail(email, otp, name);

    res.status(201).json({
      message: 'Registration successful. Please check your email for OTP verification.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.emailOTP !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();
    await emailService.sendOTPEmail(user.email, otp, user.name);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send verification OTP to existing user
router.post('/send-verification-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();
    await emailService.sendOTPEmail(user.email, otp, user.name);

    res.json({ message: 'OTP sent successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send OTP for email verification during registration
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    
    // Store OTP temporarily (in production, use Redis or similar)
    global.tempOTPs = global.tempOTPs || {};
    global.tempOTPs[email] = {
      otp,
      expires: new Date(Date.now() + 10 * 60 * 1000),
      name
    };
    
    await emailService.sendOTPEmail(email, otp, name || 'User');
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify email OTP during registration
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    global.tempOTPs = global.tempOTPs || {};
    const storedData = global.tempOTPs[email];
    
    if (!storedData || storedData.otp !== otp || storedData.expires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Clean up
    delete global.tempOTPs[email];
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Authentication
router.post('/google-auth', async (req, res) => {
  try {
    const { googleId, name, email, picture, role = 'customer' } = req.body;
    
    let user = await User.findOne({ email });
    
    if (user) {
      // Existing user - update Google ID and login directly
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture;
      }
      user.isEmailVerified = true; // Google emails are verified
      await user.save();
    } else {
      // New user - create account
      user = new User({
        googleId,
        name,
        email,
        role,
        picture,
        isEmailVerified: true,
        authProvider: 'google'
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        picture: user.picture,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ error: 'Please verify your email first', requiresVerification: true, userId: user._id });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password -emailOTP -otpExpires');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { name, phone, location, storeName, storeAddress, gtin, gst, businessRegistration, yearsInBusiness, specialties, supportEmail } = req.body;
    
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {
      name,
      phone,
      location,
      ...(currentUser.role === 'seller' && { storeName, storeAddress, gtin, gst, businessRegistration, yearsInBusiness, specialties }),
      ...(currentUser.role === 'admin' && { storeName, storeAddress, gtin, gst, businessRegistration, supportEmail })
    };
    
    const user = await User.findByIdAndUpdate(
      decoded.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailOTP -otpExpires');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send reset password OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Rate limiting - 1 request per minute
    const user = await User.findOne({ email });
    if (user && user.lastOtpRequest && Date.now() - user.lastOtpRequest < 60000) {
      return res.status(429).json({ error: 'Please wait before requesting another OTP' });
    }
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If email exists, OTP has been sent' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Store OTP with 10 minute expiry
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.lastOtpRequest = Date.now();
    await user.save();
    
    // Send OTP email
    await emailService.sendResetPasswordOTP(email, user.name, otp);
    
    res.json({ message: 'If email exists, OTP has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify reset password OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Check expiry
    if (Date.now() > user.resetPasswordOtpExpiry) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpiry = undefined;
      await user.save();
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    res.json({ message: 'OTP verified successfully', email });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Check expiry
    if (Date.now() > user.resetPasswordOtpExpiry) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpiry = undefined;
      await user.save();
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    // Verify OTP one final time
    const isValidOtp = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;