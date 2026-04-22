import crypto from 'crypto';
import User from '../models/user.js';
import bcrypt from 'bcrypt';

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email.' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();

    console.log('\n========== PASSWORD RESET OTP ==========');
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expiry: ${otpExpiry}`);
    console.log('=====================================\n');

    return res.status(200).json({
      success: true,
      message: 'OTP generated. Check terminal for OTP (development mode).',
      otp: otp
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error. ' + err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ error: 'No password reset request found. Please request OTP first.' });
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      resetToken: otp
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error. ' + err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Email, OTP, newPassword, and confirmPassword are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error. ' + err.message });
  }
};
