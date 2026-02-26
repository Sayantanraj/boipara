const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } },
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  phone: String,
  location: String,
  storeName: String,
  gtin: String,
  businessRegistration: String,
  gst: String,
  storeAddress: String,
  yearsInBusiness: Number,
  specialties: String,
  isEmailVerified: { type: Boolean, default: false },
  emailOTP: String,
  otpExpires: Date,
  resetPasswordOtp: String,
  resetPasswordOtpExpiry: Date,
  lastOtpRequest: Date,
  googleId: String,
  picture: String,
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);