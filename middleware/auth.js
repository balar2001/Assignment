const jwt = require('jsonwebtoken');
const User = require('../model/user');
// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure this is the same as used in userLogin

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, 'shhhhh');
    req.user = await User.findById(decoded.userId);
    if (!req.user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(400).json({ error: 'Invalid token.' });
  }
};