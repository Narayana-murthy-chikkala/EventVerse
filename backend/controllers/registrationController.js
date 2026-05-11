const crypto = require('crypto');
const QRCode = require('qrcode');
const Razorpay = require('razorpay');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const {
  sendEmail,
  registrationConfirmTemplate,
} = require('../utils/sendEmail');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const registerForEvent = async (req, res, next) => {
  try {
    const { eventId, ticketsCount = 1, attendeeName, attendeePhone, specialRequests } = req.body;

    if (!eventId) {
      res.statusCode = 400;
      throw new Error('Event ID is required');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    if (event.status !== 'upcoming') {
      res.statusCode = 400;
      throw new Error('Registration is not open for this event');
    }

    if (event.registeredCount + ticketsCount > event.capacity) {
      res.statusCode = 400;
      throw new Error('Not enough spots available');
    }

    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: eventId,
      status: { $ne: 'cancelled' },
    });

    if (existingRegistration) {
      res.statusCode = 400;
      throw new Error('You are already registered for this event');
    }

    let ticketType = 'general';
    let pricePerTicket = event.price;

    if (
      event.earlyBirdPrice &&
      event.earlyBirdDeadline &&
      new Date() < new Date(event.earlyBirdDeadline)
    ) {
      ticketType = 'early-bird';
      pricePerTicket = event.earlyBirdPrice;
    }

    const totalAmount = pricePerTicket * ticketsCount;

    if (event.isFree || event.price === 0 || totalAmount === 0) {
      const registration = await Registration.create({
        user: req.user._id,
        event: eventId,
        ticketType,
        ticketsCount,
        totalAmount: 0,
        paymentStatus: 'free',
        status: 'confirmed',
        attendeeName: attendeeName || req.user.name,
        attendeePhone: attendeePhone || req.user.phone,
        specialRequests: specialRequests || '',
      });

      const qrData = JSON.stringify({
        registrationId: registration._id,
        userId: req.user._id,
        eventId: event._id,
        eventTitle: event.title,
        date: event.date,
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      registration.qrCode = qrCodeDataUrl;
      await registration.save();

      event.registeredCount += ticketsCount;
      await event.save();

      try {
        await sendEmail({
          to: req.user.email,
          subject: `🎫 Registration Confirmed — ${event.title}`,
          html: registrationConfirmTemplate(
            req.user.name,
            event.title,
            event.date,
            event.venue,
            qrCodeDataUrl
          ),
        });
      } catch (emailError) {
        console.error('Confirmation email failed:', emailError.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: { registration },
      });
    }

    const tempRegistration = await Registration.create({
      user: req.user._id,
      event: eventId,
      ticketType,
      ticketsCount,
      totalAmount,
      paymentStatus: 'pending',
      status: 'confirmed',
      attendeeName: attendeeName || req.user.name,
      attendeePhone: attendeePhone || req.user.phone,
      specialRequests: specialRequests || '',
    });

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: tempRegistration._id.toString(),
    });

    tempRegistration.orderId = order.id;
    await tempRegistration.save();

    res.status(200).json({
      success: true,
      message: 'Payment order created',
      data: {
        orderId: order.id,
        amount: totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        registrationId: tempRegistration._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      registrationId,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.statusCode = 400;
      throw new Error('Payment details are required');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      res.statusCode = 400;
      throw new Error('Payment verification failed');
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      res.statusCode = 404;
      throw new Error('Registration not found');
    }

    const event = await Event.findById(registration.event);
    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    registration.paymentStatus = 'paid';
    registration.paymentId = razorpayPaymentId;

    const qrData = JSON.stringify({
      registrationId: registration._id,
      userId: registration.user,
      eventId: event._id,
      eventTitle: event.title,
      date: event.date,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    registration.qrCode = qrCodeDataUrl;
    await registration.save();

    await Payment.create({
      user: registration.user,
      event: registration.event,
      registration: registration._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount: registration.totalAmount,
      currency: 'INR',
      status: 'paid',
    });

    event.registeredCount += registration.ticketsCount;
    await event.save();

    const user = await require('../models/User').findById(registration.user);

    try {
      await sendEmail({
        to: user.email,
        subject: `🎫 Ticket Confirmed — ${event.title}`,
        html: registrationConfirmTemplate(
          user.name,
          event.title,
          event.date,
          event.venue,
          qrCodeDataUrl
        ),
      });
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and registration confirmed!',
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      res.statusCode = 404;
      throw new Error('Registration not found');
    }

    if (registration.user.toString() !== req.user._id.toString()) {
      res.statusCode = 403;
      throw new Error('Not authorized to cancel this registration');
    }

    if (registration.status === 'cancelled') {
      res.statusCode = 400;
      throw new Error('Registration is already cancelled');
    }

    registration.status = 'cancelled';
    await registration.save();

    const event = await Event.findById(registration.event);
    if (event) {
      event.registeredCount = Math.max(
        0,
        event.registeredCount - registration.ticketsCount
      );
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email avatar phone');

    if (!registration) {
      res.statusCode = 404;
      throw new Error('Registration not found');
    }

    if (
      registration.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.statusCode = 403;
      throw new Error('Not authorized to view this registration');
    }

    res.status(200).json({
      success: true,
      message: 'Registration fetched',
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  verifyPayment,
  cancelRegistration,
  getRegistrationById,
};
