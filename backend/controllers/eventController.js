const Event = require('../models/Event');

const getAllEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
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
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('organizer', 'name avatar')
      .select('-images.data -thumbnail.data');

    res.status(200).json({
      success: true,
      message: 'Events fetched',
      data: {
        events,
        totalPages,
        currentPage: page,
        totalEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar bio')
      .select('-images.data -thumbnail.data');

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    res.status(200).json({
      success: true,
      message: 'Event fetched',
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const imageObjects = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        imageObjects.push({
          data: file.buffer,
          filename: file.originalname,
          mimetype: file.mimetype,
        });
      }
    }

    const eventData = { ...req.body };
    eventData.organizer = req.user._id;

    if (imageObjects.length > 0) {
      eventData.images = imageObjects;
      if (!eventData.thumbnail) {
        eventData.thumbnail = imageObjects[0];
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

    if (req.files && req.files.length > 0) {
      const newImageObjects = [];
      for (const file of req.files) {
        newImageObjects.push({
          data: file.buffer,
          filename: file.originalname,
          mimetype: file.mimetype,
        });
      }
      req.body.images = [...event.images, ...newImageObjects];
      if (!event.thumbnail && newImageObjects.length > 0) {
        req.body.thumbnail = newImageObjects[0];
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

    event.status = 'cancelled';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event cancelled successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ isFeatured: true, status: 'upcoming' })
      .sort({ date: 1 })
      .limit(6)
      .populate('organizer', 'name avatar')
      .select('-images.data -thumbnail.data');

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
          sampleThumbnail: { $first: '$thumbnail' },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          'sampleThumbnail.filename': 1,
          'sampleThumbnail.mimetype': 1,
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
      .sort({ date: 1 })
      .limit(3)
      .populate('organizer', 'name avatar')
      .select('-images.data -thumbnail.data');

    res.status(200).json({
      success: true,
      message: 'Upcoming events fetched',
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

const getEventImage = async (req, res, next) => {
  try {
    const { eventId, imageIndex } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    const index = parseInt(imageIndex) || 0;
    if (!event.images || !event.images[index]) {
      res.statusCode = 404;
      throw new Error('Image not found');
    }

    const image = event.images[index];
    res.set('Content-Type', image.mimetype);
    res.set('Content-Disposition', `inline; filename="${image.filename}"`);
    res.send(image.data);
  } catch (error) {
    next(error);
  }
};

const getEventThumbnail = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    if (!event.thumbnail || !event.thumbnail.data) {
      res.statusCode = 404;
      throw new Error('Thumbnail not found');
    }

    res.set('Content-Type', event.thumbnail.mimetype);
    res.set('Content-Disposition', `inline; filename="${event.thumbnail.filename}"`);
    res.send(event.thumbnail.data);
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
