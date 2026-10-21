const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const paymentService = require('../services/payementService');
const jobQueue = require('../services/jobQueue');
const cacheService = require('../services/cacheService');
const {
  sendEmail,
  sendTicketEmail,
} = require('../utils/sendEmail');

/**
 * System Design Concurrency Control & Ticket Reservation:
 * 1. Atomic Check-and-Reserve prevents race conditions and overselling.
 * 2. 10-Minute Hold Window with TTL for active checkout sessions.
 * 3. Asynchronous Job Queue for non-blocking QR & Email generation.
 * 4. Cache Invalidation across event queries.
 */
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

      // Offload email dispatch to background queue (non-blocking)
      jobQueue.enqueue('SEND_TICKET_EMAIL', {
        to: req.user.email,
        name: req.user.name,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        qrCodeDataUrl,
      });

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
    try {
      order = await paymentService.createOrder(
        totalAmount,
        tempRegistration._id.toString(),
        {
          eventId: event._id.toString(),
          eventTitle: event.title,
          userId: req.user._id.toString(),
        }
      );
    } catch (orderError) {
      // If payment order generation fails, immediately release the held spots!
      await Event.findByIdAndUpdate(eventId, {
        $inc: { reservedCount: -parsedCount },
      });
      tempRegistration.status = 'failed';
      tempRegistration.paymentStatus = 'failed';
      await tempRegistration.save({ validateBeforeSave: false });
      throw orderError;
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

    // Idempotency: If already paid and verified, return success immediately
    if (registration.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and registration confirmed!',
        data: { registration },
      });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.statusCode = 400;
      throw new Error('Payment details are required');
    }

    const isValid = paymentService.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      res.statusCode = 400;
      throw new Error('Payment verification failed');
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
    await registration.save({ validateBeforeSave: false });

    // Idempotent payment log
    const existingPayment = await Payment.findOne({
      $or: [
        { registration: registration._id },
        { razorpayPaymentId: razorpayPaymentId },
      ],
    });

    if (!existingPayment) {
      await Payment.create({
        user: registration.user,
        event: registration.event,
        registration: registration._id,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: registration.totalAmount || 0,
        currency: 'INR',
        status: 'paid',
      });
    }

    // Invalidate event cache
    await cacheService.del(`events:${registration.event}`);
    await cacheService.delPattern('events:*');

    // Asynchronously dispatch ticket email in background
    const user = await require('../models/User').findById(registration.user);
    if (user && user.email) {
      jobQueue.enqueue('SEND_TICKET_EMAIL', {
        to: user.email,
        name: user.name,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        qrCodeDataUrl,
      });
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
    registration.reservationExpiresAt = null;
    await registration.save({ validateBeforeSave: false });

    // Release capacity back to event
    if (previousStatus === 'confirmed') {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: { registeredCount: -countToRelease },
      });
    } else if (previousStatus === 'reserved') {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: { reservedCount: -countToRelease },
      });
    }

    // Keep counts non-negative
    await Event.updateOne(
      { _id: registration.event, registeredCount: { $lt: 0 } },
      { $set: { registeredCount: 0 } }
    );
    await Event.updateOne(
      { _id: registration.event, reservedCount: { $lt: 0 } },
      { $set: { reservedCount: 0 } }
    );

    // Invalidate cache
    await cacheService.del(`events:${registration.event}`);
    await cacheService.delPattern('events:*');

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

const deleteRegistration = async (req, res, next) => {
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
      throw new Error('Not authorized to delete this registration');
    }

    const countToRelease = Number(registration.ticketsCount) || 1;

    if (registration.status === 'confirmed') {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: { registeredCount: -countToRelease },
      });
    } else if (registration.status === 'reserved') {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: { reservedCount: -countToRelease },
      });
    }

    await Event.updateOne(
      { _id: registration.event, registeredCount: { $lt: 0 } },
      { $set: { registeredCount: 0 } }
    );
    await Event.updateOne(
      { _id: registration.event, reservedCount: { $lt: 0 } },
      { $set: { reservedCount: 0 } }
    );

    await Payment.deleteMany({ registration: registration._id });
    await Registration.findByIdAndDelete(req.params.id);

    // Invalidate cache
    await cacheService.del(`events:${registration.event}`);
    await cacheService.delPattern('events:*');

    res.status(200).json({
      success: true,
      message: 'Registration deleted successfully',
      data: { id: req.params.id },
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
      data: {
        registration,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const registrations = await Registration.find({
      user: req.user._id,
      event: eventId,
    })
      .populate('event', 'title thumbnailUrl date venue city category status price isFree')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Event registrations fetched',
      data: { registrations },
    });
  } catch (error) {
    next(error);
  }
};

const resendTicketEmail = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email');

    if (!registration) {
      res.statusCode = 404;
      throw new Error('Registration not found');
    }

    const ownerId = registration.user?._id ? registration.user._id.toString() : registration.user?.toString();
    if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') {
      res.statusCode = 403;
      throw new Error('Not authorized to access this registration');
    }

    if (registration.status === 'cancelled') {
      res.statusCode = 400;
      throw new Error('Cannot send ticket for a cancelled registration');
    }

    const event = registration.event;
    if (!event) {
      res.statusCode = 404;
      throw new Error('Associated event not found');
    }

    let qrCodeDataUrl = registration.qrCode;
    if (!qrCodeDataUrl) {
      const qrData = JSON.stringify({
        registrationId: registration._id,
        userId: ownerId,
        eventId: event._id,
        eventTitle: event.title,
        date: event.date,
      });
      qrCodeDataUrl = await QRCode.toDataURL(qrData);
      registration.qrCode = qrCodeDataUrl;
      await registration.save({ validateBeforeSave: false });
    }

    const targetEmail = (req.body?.email || req.user.email || registration.user?.email || '').trim();
    if (!targetEmail) {
      res.statusCode = 400;
      throw new Error('No recipient email found');
    }

    const recipientName =
      registration.attendeeName || req.user.name || registration.user?.name || 'Festival Enthusiast';

    // Queue email asynchronously
    jobQueue.enqueue('SEND_TICKET_EMAIL', {
      to: targetEmail,
      name: recipientName,
      eventTitle: event.title,
      eventDate: event.date,
      eventVenue: event.venue,
      qrCodeDataUrl,
    });

    res.status(200).json({
      success: true,
      message: `Ticket dispatch scheduled for ${targetEmail}!`,
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
