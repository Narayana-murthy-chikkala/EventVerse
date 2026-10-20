const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const paymentService = require('../services/payementService');
const {
  sendEmail,
  sendTicketEmail,
  registrationConfirmTemplate,
} = require('../utils/sendEmail');

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

    // Block registration if the event date has already passed
    if (event.date && new Date(event.date) < new Date()) {
      res.statusCode = 400;
      throw new Error('This event has already taken place. Booking is no longer available.');
    }

    if (event.registeredCount + ticketsCount > event.capacity) {
      res.statusCode = 400;
      throw new Error('Not enough spots available');
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
      await registration.save({ validateBeforeSave: false });

      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: ticketsCount },
      });

      try {
        await sendTicketEmail({
          to: req.user.email,
          name: req.user.name,
          eventTitle: event.title,
          eventDate: event.date,
          eventVenue: event.venue,
          qrCodeDataUrl,
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

    // Paid event — create pending registration and Razorpay order
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

    // Use the centralized payment service for order creation
    const order = await paymentService.createOrder(
      totalAmount,
      tempRegistration._id.toString(),
      {
        eventId: event._id.toString(),
        eventTitle: event.title,
        userId: req.user._id.toString(),
      }
    );

    tempRegistration.orderId = order.id;
    await tempRegistration.save({ validateBeforeSave: false });

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

    if (!registrationId) {
      res.statusCode = 400;
      throw new Error('Registration ID is required');
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      res.statusCode = 404;
      throw new Error('Registration not found');
    }

    // Idempotent: If already marked as paid, return success immediately
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

    // Use the centralized payment service for signature verification
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
    await registration.save({ validateBeforeSave: false });

    // Ensure payment record is recorded cleanly
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

    await Event.findByIdAndUpdate(registration.event, {
      $inc: { registeredCount: registration.ticketsCount || 1 },
    });

    const user = await require('../models/User').findById(registration.user);

    if (user && user.email) {
      try {
        await sendTicketEmail({
          to: user.email,
          name: user.name,
          eventTitle: event.title,
          eventDate: event.date,
          eventVenue: event.venue,
          qrCodeDataUrl,
        });
      } catch (emailError) {
        console.error('Confirmation email failed:', emailError.message);
      }
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

    registration.status = 'cancelled';
    await registration.save({ validateBeforeSave: false });

    const event = await Event.findById(registration.event);
    if (event) {
      const newCount = Math.max(
        0,
        (event.registeredCount || 0) - (registration.ticketsCount || 1)
      );
      await Event.findByIdAndUpdate(registration.event, {
        registeredCount: newCount,
      });
    }

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

    // If registration was confirmed, free up the registered count
    if (registration.status === 'confirmed') {
      const event = await Event.findById(registration.event);
      if (event) {
        const newCount = Math.max(
          0,
          (event.registeredCount || 0) - (registration.ticketsCount || 1)
        );
        await Event.findByIdAndUpdate(registration.event, {
          registeredCount: newCount,
        });
      }
    }

    await Payment.deleteMany({ registration: registration._id });
    await Registration.findByIdAndDelete(req.params.id);

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

    // Must be owner or admin
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

    // Ensure QR code is present
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

    const sendRes = await sendTicketEmail({
      to: targetEmail,
      name: recipientName,
      eventTitle: event.title,
      eventDate: event.date,
      eventVenue: event.venue,
      qrCodeDataUrl,
    });

    res.status(200).json({
      success: true,
      simulated: sendRes?.simulated || false,
      message: sendRes?.simulated
        ? `SMTP not fully configured. Simulated ticket dispatch to ${targetEmail}.`
        : `Official ticket email sent successfully to ${targetEmail}!`,
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
