const User = require('../models/User');
const Registration = require('../models/Registration');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    const registrationCount = await Registration.countDocuments({
      user: user._id,
      status: 'confirmed',
    });

    res.status(200).json({
      success: true,
      message: 'User profile fetched',
      data: {
        user,
        registrationCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars');
      user.avatar = avatarUrl;
    }

    const { name, bio, phone, city, favoriteCategories } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (favoriteCategories) {
      user.favoriteCategories =
        typeof favoriteCategories === 'string'
          ? JSON.parse(favoriteCategories)
          : favoriteCategories;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event', 'title thumbnail date venue city category status price isFree')
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Registrations fetched',
      data: { registrations },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getMyRegistrations };
