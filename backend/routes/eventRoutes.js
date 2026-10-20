const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
  getEventsByCategory,
  getUpcomingEvents,
  getEventImage,
  getEventThumbnail,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, organizerOrAdmin } = require('../middleware/adminMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

router.get('/featured', getFeaturedEvents);
router.get('/categories', getEventsByCategory);
router.get('/upcoming', getUpcomingEvents);
router.get('/:eventId/thumbnail', getEventThumbnail);
router.get('/:eventId/images/:imageIndex', getEventImage);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', protect, organizerOrAdmin, uploadMultiple, createEvent);
router.put('/:id', protect, organizerOrAdmin, uploadMultiple, updateEvent);
router.delete('/:id', protect, organizerOrAdmin, deleteEvent);

module.exports = router;
