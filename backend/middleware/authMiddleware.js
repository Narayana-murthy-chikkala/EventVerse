const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.statusCode = 401;
      return next(new Error('Not authorized, no token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.statusCode = 401;
      return next(new Error('Not authorized, user not found'));
    }

    req.user = user;
    next();
  } catch (error) {
    res.statusCode = 401;
    next(new Error('Not authorized, token invalid'));
  }
};

module.exports = { protect };
