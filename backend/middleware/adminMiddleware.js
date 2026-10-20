const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.statusCode = 403;
  return next(new Error('Admin access only'));
};

const organizerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
    return next();
  }
  res.statusCode = 403;
  return next(new Error('Organizer or Admin access required'));
};

module.exports = { adminOnly, organizerOrAdmin };
