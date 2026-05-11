const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      revenueResult,
      categoryBreakdown,
      recentRegistrations,
      upcomingEvents,
      monthlyRegistrations,
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments({ status: 'confirmed' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Event.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      Registration.find({ status: 'confirmed' })
        .sort({ registeredAt: -1 })
        .limit(5)
        .populate('user', 'name email avatar')
        .populate('event', 'title date thumbnail'),
      Event.find({ status: 'upcoming', date: { $gte: now } })
        .sort({ date: 1 })
        .limit(5),
      Registration.aggregate([
        {
          $match: {
            status: 'confirmed',
            registeredAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$registeredAt' },
              month: { $month: '$registeredAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' },
                  ],
                },
              ],
            },
            count: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched',
      data: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalRevenue,
        categoryBreakdown,
        recentRegistrations,
        upcomingEvents,
        monthlyRegistrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: {
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    if (req.user._id.toString() === req.params.id) {
      res.statusCode = 400;
      throw new Error('Cannot change your own role');
    }

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User role updated to ${user.role}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    if (req.user._id.toString() === req.params.id) {
      res.statusCode = 400;
      throw new Error('Cannot delete your own account from admin panel');
    }

    await Registration.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User and their registrations deleted',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const getAllRegistrations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.eventId) {
      filter.event = req.query.eventId;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const totalRegistrations = await Registration.countDocuments(filter);
    const registrations = await Registration.find(filter)
      .populate('user', 'name email avatar')
      .populate('event', 'title date thumbnail')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Registrations fetched',
      data: {
        registrations,
        totalRegistrations,
        totalPages: Math.ceil(totalRegistrations / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    next(error);
  }
};

const toggleFeaturedEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.statusCode = 404;
      throw new Error('Event not found');
    }

    event.isFeatured = !event.isFeatured;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Event ${event.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllRegistrations,
  toggleFeaturedEvent,
};
