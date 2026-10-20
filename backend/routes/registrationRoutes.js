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

router.post('/register', protect, registerForEvent);
router.post('/verify-payment', protect, verifyPayment);
router.get('/event/:eventId/mine', protect, getMyEventRegistrations);
router.post('/:id/send-email', protect, resendTicketEmail);
router.get('/:id', protect, getRegistrationById);
router.delete('/:id/cancel', protect, cancelRegistration);
router.delete('/:id', protect, deleteRegistration);

module.exports = router;
