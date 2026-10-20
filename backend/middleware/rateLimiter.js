const rateLimit = require('express-rate-limit');

/**
 * EventVerse Rate Limiting Middleware Suite
 * Implements token bucket / sliding window rate limiting to protect against
 * DDoS, brute-force attacks, ticket scalper bots, and email flooding.
 */

// 1. General API Limiter (Applied across all /api routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// 2. Strict Auth Limiter (Prevents brute-force on Login / Registration)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// 3. Ticket Booking / Reservation Limiter (Anti-Bot & Anti-Scalping)
// Protects ticket booking endpoints so bots cannot spam simultaneous bookings
const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 booking checkout requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'High traffic detected. Please wait a moment before booking tickets again.',
  },
});

// 4. Email Dispatch Limiter (Prevents SMTP quota exhaustion / email spam)
const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit resending tickets to 5 times per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many email requests. Please check your inbox or try again in 10 minutes.',
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  bookingLimiter,
  emailLimiter,
};
