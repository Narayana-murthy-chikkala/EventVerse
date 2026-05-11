const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const {
  sendEmail,
  welcomeEmailTemplate,
  passwordResetTemplate,
} = require('../utils/sendEmail');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.statusCode = 400;
      throw new Error('Please provide name, email, and password');
    }

    if (password.length < 6) {
      res.statusCode = 400;
      throw new Error('Password must be at least 6 characters');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.statusCode = 400;
      throw new Error('An account with this email already exists');
    }

    const user = await User.create({ name, email, password });

    try {
      await sendEmail({
        to: user.email,
        subject: '🪔 Welcome to SanskritiUtsav!',
        html: welcomeEmailTemplate(user.name),
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          city: user.city,
          favoriteCategories: user.favoriteCategories,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          city: user.city,
          favoriteCategories: user.favoriteCategories,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'User profile fetched',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.statusCode = 400;
      throw new Error('Please provide current and new password');
    }

    if (newPassword.length < 6) {
      res.statusCode = 400;
      throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.statusCode = 400;
      throw new Error('Please provide an email');
    }

    const user = await User.findOne({ email });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      user.otpHash = await bcrypt.hash(otp, salt);
      user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      try {
        await sendEmail({
          to: user.email,
          subject: '🔐 Password Reset OTP — SanskritiUtsav',
          html: passwordResetTemplate(user.name, otp),
        });
      } catch (emailError) {
        console.error('Password reset email failed:', emailError.message);
        user.otpHash = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.statusCode = 500;
        throw new Error('Email could not be sent. Please try again.');
      }
    }

    res.status(200).json({
      success: true,
      message: 'If this email is registered, an OTP has been sent',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.statusCode = 400;
      throw new Error('Please provide email, OTP, and new password');
    }

    if (newPassword.length < 6) {
      res.statusCode = 400;
      throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findOne({
      email,
      otpExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.statusCode = 400;
      throw new Error('Invalid or expired OTP');
    }

    const isOtpValid = await bcrypt.compare(otp, user.otpHash);
    if (!isOtpValid) {
      res.statusCode = 400;
      throw new Error('Invalid or expired OTP');
    }

    user.password = newPassword;
    user.otpHash = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
};
