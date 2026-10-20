const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllRegistrations,
  toggleFeaturedEvent,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, organizerOrAdmin } = require('../middleware/adminMiddleware');

// Super-admin only operations
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Accessible by both admin and organizers
router.get('/stats', protect, organizerOrAdmin, getDashboardStats);
router.get('/registrations', protect, organizerOrAdmin, getAllRegistrations);
router.put('/events/:id/feature', protect, organizerOrAdmin, toggleFeaturedEvent);

module.exports = router;
