const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketType: {
      type: String,
      enum: ['general', 'early-bird', 'vip'],
      default: 'general',
    },
    ticketsCount: {
      type: Number,
      default: 1,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'free', 'failed', 'expired'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      default: '',
    },
    orderId: {
      type: String,
      default: '',
    },
    qrCode: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['reserved', 'confirmed', 'cancelled', 'waitlisted', 'expired'],
      default: 'confirmed',
    },
    reservationExpiresAt: {
      type: Date,
      default: null,
    },
    specialRequests: {
      type: String,
      default: '',
    },
    attendeeName: {
      type: String,
      default: '',
    },
    attendeePhone: {
      type: String,
      default: '',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
