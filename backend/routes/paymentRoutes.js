const express = require('express');
const router = express.Router();
const {
  getMyPayments,
  getPaymentById,
  checkPaymentStatus,
  requestRefund,
  handleWebhook,
  getAllPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Webhook — must be BEFORE express.json() middleware, but since we mount
// this router after express.json() in server.js, the raw body is already parsed.
// For production, consider raw body parsing for webhook verification.
router.post('/webhook', handleWebhook);

// User routes (authenticated)
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPaymentById);
router.get('/:id/status', protect, checkPaymentStatus);
router.post('/:id/refund', protect, requestRefund);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllPayments);

module.exports = router;
