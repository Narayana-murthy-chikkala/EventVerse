const Registration = require('../models/Registration');
const Event = require('../models/Event');
const cacheService = require('./cacheService');

/**
 * Ticket Janitor Service (System Design: Concurrency & TTL Cleanup)
 * Reconciles ticket reservations that were held for checkout but were
 * abandoned, timed out, or had failed payments.
 * 
 * Atomically releases the reserved tickets back to the available pool.
 */
class TicketJanitor {
  constructor() {
    this.intervalId = null;
    this.sweepIntervalMs = 60 * 1000; // Run every 60 seconds
  }

  start() {
    if (this.intervalId) return;

    console.log('🧹 [TicketJanitor] Started reservation expiration cleanup service');
    
    // Run an initial sweep immediately on startup
    this.sweep();

    // Schedule regular sweeps
    this.intervalId = setInterval(() => {
      this.sweep();
    }, this.sweepIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧹 [TicketJanitor] Stopped cleanup service');
    }
  }

  async sweep() {
    try {
      const now = new Date();

      // Find all reservations that have expired and are still pending payment
      const expiredReservations = await Registration.find({
        status: 'reserved',
        paymentStatus: 'pending',
        reservationExpiresAt: { $lt: now, $ne: null },
      });

      if (!expiredReservations || expiredReservations.length === 0) {
        return;
      }

      console.log(
        `🧹 [TicketJanitor] Found ${expiredReservations.length} expired reservation(s) to release.`
      );

      for (const reg of expiredReservations) {
        try {
          // 1. Mark registration as expired
          reg.status = 'expired';
          reg.paymentStatus = 'expired';
          await reg.save({ validateBeforeSave: false });

          // 2. Atomically release held tickets on the event
          const countToRelease = Number(reg.ticketsCount) || 1;
          await Event.findByIdAndUpdate(reg.event, {
            $inc: { reservedCount: -countToRelease },
          });

          // Ensure reservedCount does not drop below 0 due to any race conditions
          await Event.updateOne(
            { _id: reg.event, reservedCount: { $lt: 0 } },
            { $set: { reservedCount: 0 } }
          );

          console.log(
            `✅ [TicketJanitor] Released ${countToRelease} ticket(s) back to pool for event ${reg.event} (Reg: ${reg._id})`
          );

          // Invalidate cache so released tickets are instantly visible
          await cacheService.delPattern('events:*');
        } catch (itemErr) {
          console.error(
            `❌ [TicketJanitor] Error processing expired reservation ${reg._id}:`,
            itemErr.message
          );
        }
      }
    } catch (err) {
      console.error('❌ [TicketJanitor] Error running sweep cycle:', err.message);
    }
  }
}

module.exports = new TicketJanitor();
