const Event = require('../models/Event');
const cloudinaryService = require('../services/cloudinaryService');
const cacheService = require('../services/cacheService');

const getAllEvents = async (req, res, next) => {
  try {
    const cacheKey = `events:list:${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fromCache: true,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.organizer) {
      filter.organizer = req.query.organizer;
    }

    if (req.query.city) {
      filter.city = { $regex: req.query.city, $options: 'i' };
    }

    if (req.query.state) {
      filter.state = { $regex: req.query.state, $options: 'i' };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.isFree === 'true') {
      filter.$or = [{ price: 0 }, { isFree: true }];
    }

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      const searchConditions = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { culturalOrigin: searchRegex },
        { tags: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    if (req.query.tags) {
      const tagsArray = req.query.tags.split(',').map((t) => t.trim());
      if (!filter.$and) filter.$and = [];
      filter.$and.push({ tags: { $in: tagsArray } });
    }

    let sortObj = { date: 1 };
    if (req.query.sortBy === 'price') sortObj = { price: 1 };
    if (req.query.sortBy === 'popularity') sortObj = { registeredCount: -1 };
    if (req.query.sortBy === 'date') sortObj = { date: 1 };

    const totalEvents = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalEvents / limit);

    const events = await Event.find(filter)
      .select('-thumbnail.data -images.data')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('organizer', 'name avatar');

    const responsePayload = {
      success: true,
      message: 'Events fetched',
      data: {
        events,
        totalPages,
        currentPage: page,
        totalEvents,
      },
    };

    // Cache list for 120 seconds
    await cacheService.set(cacheKey, responsePayload, 120);

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const cacheKey = `events:detail:${req.params.id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fromCache: true,
      });
    }

    const event = await Event.findById(req.params.id)
      .select('-thumbnail.data -images.data')
      .populate('organizer', 'name avatar bio');

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    const responsePayload = {
      success: true,
      message: 'Event fetched',
      data: { event },
    };

    // Cache event detail for 180 seconds
    await cacheService.set(cacheKey, responsePayload, 180);

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const imageUrls = [];

    // Upload images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinaryService.uploadImage(file.buffer, {
            folder: 'eventverse/events',
          });
          imageUrls.push({
            url: result.url,
            publicId: result.publicId,
            filename: file.originalname,
          });
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError.message);
        }
      }
    }

    const eventData = { ...req.body };
    eventData.organizer = req.user._id;

    if (imageUrls.length > 0) {
      eventData.images = imageUrls;
      // Use the first image as the thumbnail
      if (!eventData.thumbnailUrl) {
        // Upload a separate optimized thumbnail
        try {
          const thumbResult = await cloudinaryService.uploadThumbnail(
            req.files[0].buffer,
            'new'
          );
          eventData.thumbnailUrl = thumbResult.url;
          eventData.thumbnailPublicId = thumbResult.publicId;
        } catch (thumbError) {
          // Fallback: use first image URL as thumbnail
          eventData.thumbnailUrl = imageUrls[0].url;
          eventData.thumbnailPublicId = imageUrls[0].publicId;
        }
      }
    }

    if (eventData.performers && typeof eventData.performers === 'string') {
      eventData.performers = JSON.parse(eventData.performers);
    }
    if (eventData.schedule && typeof eventData.schedule === 'string') {
      eventData.schedule = JSON.parse(eventData.schedule);
    }
    if (eventData.tags && typeof eventData.tags === 'string') {
      eventData.tags = JSON.parse(eventData.tags);
    }
    if (eventData.highlights && typeof eventData.highlights === 'string') {
      eventData.highlights = JSON.parse(eventData.highlights);
    }

    if (eventData.isFree === 'true' || eventData.isFree === true) {
      eventData.price = 0;
      eventData.isFree = true;
    }

    const event = await Event.create(eventData);

    // Invalidate event cache so fresh data is loaded
    await cacheService.delPattern('events:*');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    });
  } catch (error) {
    console.error('Event creation error:', error);
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    if (
      req.user.role !== 'admin' &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      res.statusCode = 403;
      throw new Error('Access denied: You can only edit your own events');
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        try {
          const result = await cloudinaryService.uploadImage(file.buffer, {
            folder: 'eventverse/events',
          });
          newImageUrls.push({
            url: result.url,
            publicId: result.publicId,
            filename: file.originalname,
          });
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError.message);
        }
      }

      // Append new images to existing ones
      req.body.images = [...(event.images || []), ...newImageUrls];

      // Set thumbnail if not already set
      if (!event.thumbnailUrl && newImageUrls.length > 0) {
        try {
          const thumbResult = await cloudinaryService.uploadThumbnail(
            req.files[0].buffer,
            event._id.toString()
          );
          req.body.thumbnailUrl = thumbResult.url;
          req.body.thumbnailPublicId = thumbResult.publicId;
        } catch (thumbError) {
          req.body.thumbnailUrl = newImageUrls[0].url;
          req.body.thumbnailPublicId = newImageUrls[0].publicId;
        }
      }
    }

    if (req.body.performers && typeof req.body.performers === 'string') {
      req.body.performers = JSON.parse(req.body.performers);
    }
    if (req.body.schedule && typeof req.body.schedule === 'string') {
      req.body.schedule = JSON.parse(req.body.schedule);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (req.body.highlights && typeof req.body.highlights === 'string') {
      req.body.highlights = JSON.parse(req.body.highlights);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Invalidate event cache so updated data is served
    await cacheService.delPattern('events:*');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent },
    });
  } catch (error) {
    console.error('Event update error:', error);
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    if (
      req.user.role !== 'admin' &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      res.statusCode = 403;
      throw new Error('Access denied: You can only delete your own events');
    }

    // Clean up Cloudinary images
    const publicIdsToDelete = [];
    if (event.images && event.images.length > 0) {
      event.images.forEach((img) => {
        if (img.publicId) publicIdsToDelete.push(img.publicId);
      });
    }
    if (event.thumbnailPublicId) {
      publicIdsToDelete.push(event.thumbnailPublicId);
    }
    if (publicIdsToDelete.length > 0) {
      await cloudinaryService.deleteMultipleImages(publicIdsToDelete);
    }

    const Registration = require('../models/Registration');
    await Registration.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(req.params.id);

    // Invalidate event cache so deleted event is removed
    await cacheService.delPattern('events:*');

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ isFeatured: true, status: 'upcoming' })
      .select('-thumbnail.data -images.data')
      .sort({ date: 1 })
      .limit(6)
      .populate('organizer', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Featured events fetched',
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

const getEventsByCategory = async (req, res, next) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          sampleThumbnail: { $first: '$thumbnailUrl' },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          sampleThumbnail: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: 'Categories fetched',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

const getUpcomingEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      status: 'upcoming',
      date: { $gte: new Date() },
    })
      .select('-thumbnail.data -images.data')
      .sort({ date: 1 })
      .limit(3)
      .populate('organizer', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Upcoming events fetched',
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

// Legacy endpoint — kept for backward compatibility with existing events
// that may still have binary image data
const getEventImage = async (req, res, next) => {
  try {
    const { eventId, imageIndex } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    const index = parseInt(imageIndex) || 0;

    // New Cloudinary-based images — redirect to the URL
    if (event.images && event.images[index] && event.images[index].url) {
      return res.redirect(event.images[index].url);
    }

    // Legacy binary images
    if (event.images && event.images[index] && event.images[index].data) {
      const image = event.images[index];
      res.set('Content-Type', image.mimetype);
      res.set('Content-Disposition', `inline; filename="${image.filename}"`);
      return res.send(image.data);
    }

    res.statusCode = 404;
    throw new Error('Image not found');
  } catch (error) {
    next(error);
  }
};

// Legacy endpoint — kept for backward compatibility
const getEventThumbnail = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    // New Cloudinary-based thumbnail
    if (event.thumbnailUrl) {
      return res.redirect(event.thumbnailUrl);
    }

    // Legacy binary thumbnail
    if (event.thumbnail && event.thumbnail.data) {
      res.set('Content-Type', event.thumbnail.mimetype);
      res.set('Content-Disposition', `inline; filename="${event.thumbnail.filename}"`);
      return res.send(event.thumbnail.data);
    }

    res.statusCode = 404;
    throw new Error('Thumbnail not found');
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
