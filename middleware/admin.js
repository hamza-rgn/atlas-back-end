module.exports = function(req, res, next) {
    console.log('Admin Middleware - User role:', req.user.role); // Debug log

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  };