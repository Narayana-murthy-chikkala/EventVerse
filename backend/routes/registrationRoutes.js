const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  verifyPayment,
  cancelRegistration,
  deleteRegistration,
  getRegistrationById,
  getMyEventRegistrations,
  resendTicketEmail,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { bookingLimiter, emailLimiter } = require('../middleware/rateLimiter');

router.post('/register', protect, bookingLimiter, registerForEvent);
router.post('/verify-payment', protect, bookingLimiter, verifyPayment);
router.get('/event/:eventId/mine', protect, getMyEventRegistrations);
router.post('/:id/send-email', protect, emailLimiter, resendTicketEmail);
router.get('/:id', protect, getRegistrationById);
router.delete('/:id/cancel', protect, cancelRegistration);
router.delete('/:id', protect, deleteRegistration);

module.exports = router;
