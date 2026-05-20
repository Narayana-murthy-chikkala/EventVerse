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

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/google/login', googleLoginUrl);
router.get('/google/callback', googleCallback);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
