// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'Please login to access this resource',
  });
};

// Middleware to check if user is owner
const isOwner = (req, res, next) => {
  if (req.isAuthenticated()) {
    // Check against hardcoded owner email (matching ownerlist.json)
    if (req.user.email === 'yinjiasek@gmail.com') {
      return next();
    }
  }
  res.status(403).json({
    success: false,
    message: 'Access denied. Owner rights required.',
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (
      req.user.email === 'yinjiasek@gmail.com' ||
      req.user.role === 'admin'
    ) {
      // Check expiration if admin
      if (req.user.role === 'admin' && req.user.adminExpiresAt && new Date() > new Date(req.user.adminExpiresAt)) {
        return res.status(403).json({
          success: false,
          message: 'Admin rights expired.',
        });
      }
      return next();
    }
  }
  res.status(403).json({
    success: false,
    message: 'Access denied. Admin rights required.',
  });
};

module.exports = { isAuthenticated, isOwner, isAdmin };
