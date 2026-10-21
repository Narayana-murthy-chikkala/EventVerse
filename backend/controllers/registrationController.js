const QRCode = require('qrcode');
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

    const parsedCount = Math.max(1, parseInt(ticketsCount, 10) || 1);

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

    // Block registration if the event date has already passed
    if (event.date && new Date(event.date) < new Date()) {
      res.statusCode = 400;
      throw new Error('This event has already taken place. Booking is no longer available.');
    }

    // Block registration if the event date has already passed
    if (event.date && new Date(event.date) < new Date()) {
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
    let pricePerTicket = event.price || 0;

    if (
      event.earlyBirdPrice &&
      event.earlyBirdDeadline &&
      new Date() < new Date(event.earlyBirdDeadline)
    ) {
      ticketType = 'early-bird';
      pricePerTicket = event.earlyBirdPrice;
    }

    const totalAmount = pricePerTicket * parsedCount;

    // ==========================================
    // CASE A: FREE EVENT
    // ==========================================
    if (event.isFree || event.price === 0 || totalAmount === 0) {
      // Atomic MongoDB check-and-increment to prevent overselling
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          status: 'upcoming',
          $expr: {
            $lte: [
              { $add: ['$registeredCount', { $ifNull: ['$reservedCount', 0] }, parsedCount] },
              '$capacity',
            ],
          },
        },
        {
          $inc: { registeredCount: parsedCount },
        },
        { new: true }
      );

      if (!updatedEvent) {
        const latest = await Event.findById(eventId);
        if (latest && latest.registeredCount + parsedCount > latest.capacity) {
          res.statusCode = 400;
          throw new Error('Sorry, tickets are sold out for this event!');
        } else {
          res.statusCode = 409;
          throw new Error(
            'Remaining tickets are currently held in other users checkout carts. Please retry in a few moments.'
          );
        }
      }

      // Invalidate event cache
      await cacheService.del(`events:${eventId}`);
      await cacheService.delPattern('events:*');

      const registration = await Registration.create({
        user: req.user._id,
        event: eventId,
        ticketType,
        ticketsCount: parsedCount,
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
      await registration.save({ validateBeforeSave: false });

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

    // ==========================================
    // CASE B: PAID EVENT — ATOMIC 10-MINUTE HOLD
    // ==========================================
    // Atomically claim a reservation hold so other users cannot snatch these tickets
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'upcoming',
        $expr: {
          $lte: [
            { $add: ['$registeredCount', { $ifNull: ['$reservedCount', 0] }, parsedCount] },
            '$capacity',
          ],
        },
      },
      {
        $inc: { reservedCount: parsedCount },
      },
      { new: true }
    );

    if (!updatedEvent) {
      const latest = await Event.findById(eventId);
      if (latest && latest.registeredCount + parsedCount > latest.capacity) {
        res.statusCode = 400;
        throw new Error('Sorry, tickets are sold out for this event!');
      } else {
        res.statusCode = 409;
        throw new Error(
          'The remaining tickets are currently locked in checkout by another customer. If their payment times out in 10 minutes, they will be released back.'
        );
      }
    }

    // Invalidate event cache
    await cacheService.del(`events:${eventId}`);
    await cacheService.delPattern('events:*');

    // 10-minute hold TTL
    const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Paid event — create pending registration and Razorpay order
    const tempRegistration = await Registration.create({
      user: req.user._id,
      event: eventId,
      ticketType,
      ticketsCount: parsedCount,
      totalAmount,
      paymentStatus: 'pending',
      status: 'reserved',
      reservationExpiresAt,
      attendeeName: attendeeName || req.user.name,
      attendeePhone: attendeePhone || req.user.phone,
      specialRequests: specialRequests || '',
    });

    let order;
    const isMock = process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id' || !process.env.RAZORPAY_KEY_ID;

    if (isMock) {
      order = { id: `mock_order_${Date.now()}` };
    } else {
      order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: tempRegistration._id.toString(),
      });
    }

    tempRegistration.orderId = order.id;
    await tempRegistration.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Payment order created. Tickets reserved for 10 minutes.',
      data: {
        orderId: order.id,
        amount: totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        registrationId: tempRegistration._id,
        expiresAt: reservationExpiresAt,
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

    if (!registrationId) {
      res.statusCode = 400;
      throw new Error('Registration ID is required');
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

    const tickets = Number(registration.ticketsCount) || 1;

    // Convert hold into confirmed ticket count atomically
    if (registration.status === 'reserved') {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: {
          registeredCount: tickets,
          reservedCount: -tickets,
        },
      });
    } else if (registration.status !== 'confirmed') {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: { registeredCount: tickets },
      });
    }

    // Prevent any negative reservedCount
    await Event.updateOne(
      { _id: registration.event, reservedCount: { $lt: 0 } },
      { $set: { reservedCount: 0 } }
    );

    registration.paymentStatus = 'paid';
    registration.status = 'confirmed';
    registration.reservationExpiresAt = null;
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

    // Asynchronously dispatch ticket email in background
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

    if (
      registration.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.statusCode = 403;
      throw new Error('Not authorized to cancel this registration');
    }

    if (registration.status === 'cancelled') {
      return res.status(200).json({
        success: true,
        message: 'Registration is already cancelled',
        data: { registration },
      });
    }

    const previousStatus = registration.status;
    const countToRelease = Number(registration.ticketsCount) || 1;

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
  deleteRegistration,
  getRegistrationById,
  getMyEventRegistrations,
  resendTicketEmail,
};
