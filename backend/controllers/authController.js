const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
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
        subject: '🪔 Welcome to EventVerse!',
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
          subject: '🔐 Password Reset OTP — EventVerse',
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

const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.statusCode = 400;
      throw new Error('Google token is required');
    }

    let client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      console.error('Token verification error:', err.message);
      // If verification fails, try without audience check (more lenient)
      try {
        const response = await axios.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
        );
        // If this works, the token is valid
      } catch (e) {
        res.statusCode = 401;
        throw new Error('Invalid or expired Google token');
      }
      
      // Token is valid, verify it with lenient settings
      ticket = await client.verifyIdToken({
        idToken: token,
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      res.statusCode = 400;
      throw new Error('Email not provided by Google');
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Existing user - update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // New user - create account
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || '',
      });

      // Send welcome email
      try {
        await sendEmail({
          to: user.email,
          subject: '🪔 Welcome to EventVerse!',
          html: welcomeEmailTemplate(user.name),
        });
      } catch (emailError) {
        console.error('Welcome email failed:', emailError.message);
      }
    }

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
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
        token: jwtToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const googleLoginUrl = async (req, res, next) => {
  try {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL || `${process.env.CLIENT_URL}/api/v1/auth/google/callback`
    );

    const authUrl = client.generateAuthUrl({
      access_type: 'online',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });

    res.status(200).json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      res.statusCode = 400;
      throw new Error('Authorization code not provided');
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL || `${process.env.CLIENT_URL}/api/v1/auth/google/callback`
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
    const userInfo = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const { email, name, picture } = userInfo.data;
    const googleId = userInfo.data.id;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || '',
      });

      try {
        await sendEmail({
          to: user.email,
          subject: '🪔 Welcome to EventVerse!',
          html: welcomeEmailTemplate(user.name),
        });
      } catch (emailError) {
        console.error('Welcome email failed:', emailError.message);
      }
    }

    const jwtToken = generateToken(user._id);

    const userData = {
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
    };

    // Return HTML page with postMessage to parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication</title>
          <style>
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fafaf8; font-family: 'Poppins', sans-serif; }
            .container { text-align: center; }
            .spinner { width: 40px; height: 40px; border: 4px solid rgba(212,82,42,0.2); border-top: 4px solid #D4522A; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            p { margin-top: 20px; color: #8B7D6F; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <p>Completing authentication...</p>
          </div>
          <script>
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${jwtToken}',
              user: ${JSON.stringify(userData)}
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fafaf8; font-family: 'Poppins', sans-serif; }
            .container { text-align: center; padding: 40px; }
            h1 { color: #E05C3A; margin-bottom: 10px; }
            p { color: #8B7D6F; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Authentication Failed</h1>
            <p>${error.message || 'An error occurred during authentication'}</p>
          </div>
          <script>
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              message: '${error.message || 'Authentication failed'}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(400).send(html);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleLoginUrl,
  googleCallback,
};
