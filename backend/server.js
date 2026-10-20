const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const passport = require('passport');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load env variables
dotenv.config();
// EventVerse Server ready - Email ticket services active & deliverability enhanced

// Connect Passport Config
require('./config/passport');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const googleAuthRoutes = require('./routes/googleAuth');

const app = express();

// Connect Database
connectDB();

// Allowed Origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Passport Middleware
app.use(passport.initialize());

// System Design: Global Rate Limiter
const { globalLimiter } = require('./middleware/rateLimiter');
app.use('/api', globalLimiter);

// System Services (Ticket Janitor, In-Memory Cache, Job Queue)
const ticketJanitor = require('./services/ticketJanitor');
const cacheService = require('./services/cacheService');
const jobQueue = require('./services/jobQueue');

// Start background janitor to auto-release expired ticket holds
ticketJanitor.start();

// Health & System Design Observability Probes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`,
  });
});

app.get('/api/v1/system/metrics', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
    },
    cache: cacheService.getMetrics(),
    queue: jobQueue.getStatus(),
  });
});

// Test Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EventVerse API is running 🪔',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/registrations', registrationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Google Auth Routes
app.use('/api/auth', googleAuthRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server & background services...');
  ticketJanitor.stop();
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});