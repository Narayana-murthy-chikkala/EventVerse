const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  verifyPayment,
  cancelRegistration,
  getRegistrationById,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', protect, registerForEvent);
router.post('/verify-payment', protect, verifyPayment);
router.get('/:id', protect, getRegistrationById);
router.delete('/:id/cancel', protect, cancelRegistration);

module.exports = router;
