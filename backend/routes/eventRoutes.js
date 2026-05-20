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
const { adminOnly } = require('../middleware/adminMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

router.get('/featured', getFeaturedEvents);
router.get('/categories', getEventsByCategory);
router.get('/upcoming', getUpcomingEvents);
router.get('/:eventId/thumbnail', getEventThumbnail);
router.get('/:eventId/images/:imageIndex', getEventImage);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', protect, adminOnly, uploadMultiple, createEvent);
router.put('/:id', protect, adminOnly, uploadMultiple, updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

module.exports = router;
