const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const paymentService = require('../services/payementService');

/**
 * @desc    Get payment history for the logged-in user
 * @route   GET /api/v1/payments/my-payments
 * @access  Private
 */
const getMyPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const totalPayments = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(totalPayments / limit);

    const payments = await Payment.find(filter)
      .populate('event', 'title date venue city category')
      .populate('registration', 'ticketType ticketsCount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Payment history fetched',
      data: {
        payments,
        totalPages,
        currentPage: page,
        totalPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payment details
 * @route   GET /api/v1/payments/:id
 * @access  Private
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('event', 'title date venue city category price')
      .populate('registration', 'ticketType ticketsCount status paymentStatus qrCode')
      .populate('user', 'name email phone');

    if (!payment) {
      res.statusCode = 404;
      throw new Error('Payment not found');
    }

    // Only allow the payment owner or admin to view
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.statusCode = 403;
      throw new Error('Not authorized to view this payment');
    }

    res.status(200).json({
      success: true,
      message: 'Payment details fetched',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check payment status (fetches from Razorpay if real keys)
 * @route   GET /api/v1/payments/:id/status
 * @access  Private
 */
const checkPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.statusCode = 404;
      throw new Error('Payment not found');
    }

    if (
      payment.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.statusCode = 403;
      throw new Error('Not authorized');
    }

    let razorpayStatus = null;

    // If there's a real Razorpay payment ID, fetch its latest status
    if (payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith('mock_')) {
      try {
        const rzpPayment = await paymentService.fetchPaymentDetails(payment.razorpayPaymentId);
        razorpayStatus = {
          status: rzpPayment.status,
          method: rzpPayment.method,
          amount: rzpPayment.amount / 100, // Convert from paise to INR
          currency: rzpPayment.currency,
          capturedAt: rzpPayment.captured ? new Date(rzpPayment.created_at * 1000) : null,
        };

        // Sync local status if Razorpay says it's captured but we haven't updated
        if (rzpPayment.status === 'captured' && payment.status === 'created') {
          payment.status = 'paid';
          await payment.save();
        }
      } catch (err) {
        console.error('Failed to fetch Razorpay payment status:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment status fetched',
      data: {
        paymentId: payment._id,
        localStatus: payment.status,
        razorpayStatus,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request a refund for a payment
 * @route   POST /api/v1/payments/:id/refund
 * @access  Private
 */
const requestRefund = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('registration')
      .populate('event', 'title date');

    if (!payment) {
      res.statusCode = 404;
      throw new Error('Payment not found');
    }

    if (
      payment.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.statusCode = 403;
      throw new Error('Not authorized to request refund');
    }

    if (payment.status === 'refunded') {
      res.statusCode = 400;
      throw new Error('Payment has already been refunded');
    }

    if (payment.status !== 'paid') {
      res.statusCode = 400;
      throw new Error('Only paid payments can be refunded');
    }

    // Check if event hasn't happened yet (refund policy)
    if (payment.event && new Date(payment.event.date) < new Date()) {
      res.statusCode = 400;
      throw new Error('Cannot refund for events that have already occurred');
    }

    // Process refund via Razorpay
    const refundResult = await paymentService.processRefund(
      payment.razorpayPaymentId,
      payment.amount,
      { reason: req.body.reason || 'User requested refund' }
    );

    // Update payment status
    payment.status = 'refunded';
    await payment.save();

    // Update registration status
    if (payment.registration) {
      const registration = await Registration.findById(payment.registration._id || payment.registration);
      if (registration) {
        registration.paymentStatus = 'failed'; // Mark as not paid
        registration.status = 'cancelled';
        await registration.save();

        // Decrement registered count
        const event = await Event.findById(registration.event);
        if (event) {
          event.registeredCount = Math.max(0, event.registeredCount - registration.ticketsCount);
          await event.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        paymentId: payment._id,
        refundId: refundResult.id,
        amount: payment.amount,
        status: 'refunded',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Razorpay webhook handler
 * @route   POST /api/v1/payments/webhook
 * @access  Public (verified by signature)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = JSON.stringify(req.body);
      const isValid = paymentService.verifyWebhookSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        res.statusCode = 400;
        throw new Error('Invalid webhook signature');
      }
    }

    const { event: webhookEvent, payload } = req.body;

    switch (webhookEvent) {
      case 'payment.captured': {
        const paymentData = payload.payment.entity;
        const orderId = paymentData.order_id;

        // Find the registration with this order ID
        const registration = await Registration.findOne({ orderId });
        if (registration && registration.paymentStatus !== 'paid') {
          registration.paymentStatus = 'paid';
          registration.paymentId = paymentData.id;
          await registration.save();

          // Update or create payment record
          let payment = await Payment.findOne({ razorpayOrderId: orderId });
          if (payment) {
            payment.status = 'paid';
            payment.razorpayPaymentId = paymentData.id;
            await payment.save();
          }

          console.log(`[Webhook] Payment captured for order ${orderId}`);
        }
        break;
      }

      case 'payment.failed': {
        const paymentData = payload.payment.entity;
        const orderId = paymentData.order_id;

        const registration = await Registration.findOne({ orderId });
        if (registration) {
          registration.paymentStatus = 'failed';
          await registration.save();
        }

        let payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (payment) {
          payment.status = 'failed';
          await payment.save();
        }

        console.log(`[Webhook] Payment failed for order ${orderId}`);
        break;
      }

      case 'refund.processed': {
        const refundData = payload.refund.entity;
        const paymentId = refundData.payment_id;

        let payment = await Payment.findOne({ razorpayPaymentId: paymentId });
        if (payment && payment.status !== 'refunded') {
          payment.status = 'refunded';
          await payment.save();
        }

        console.log(`[Webhook] Refund processed for payment ${paymentId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${webhookEvent}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    // Still respond 200 to prevent Razorpay retries on our processing errors
    res.status(200).json({ success: true, message: 'Webhook received' });
  }
};

/**
 * @desc    Get all payments (admin only)
 * @route   GET /api/v1/payments/admin/all
 * @access  Private/Admin
 */
const getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;

    const totalPayments = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(totalPayments / limit);

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('event', 'title date venue category')
      .populate('registration', 'ticketType ticketsCount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate aggregate stats
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'All payments fetched',
      data: {
        payments,
        totalPages,
        currentPage: page,
        totalPayments,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPayments,
  getPaymentById,
  checkPaymentStatus,
  requestRefund,
  handleWebhook,
  getAllPayments,
};
