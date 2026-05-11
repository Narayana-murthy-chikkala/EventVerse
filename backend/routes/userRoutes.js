const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getMyRegistrations,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

router.get('/my-registrations', protect, getMyRegistrations);
router.get('/:id', getProfile);
router.put('/profile', protect, uploadSingle, updateProfile);

module.exports = router;
