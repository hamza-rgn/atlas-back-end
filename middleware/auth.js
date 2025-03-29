const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];
    
    console.log('Auth Middleware - Received token:', token); // Debug log
  
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug log
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Token verification error:', err); // Debug log
      res.status(401).json({ message: 'Token is not valid' });
    }
};


  