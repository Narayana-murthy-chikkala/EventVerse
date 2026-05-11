const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.statusCode = 403;
  return next(new Error('Admin access only'));
};

module.exports = { adminOnly };
