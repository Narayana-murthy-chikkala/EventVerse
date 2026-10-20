const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleLoginUrl,
  googleCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', googleAuth);
router.get('/google/login', googleLoginUrl);
router.get('/google/callback', googleCallback);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
