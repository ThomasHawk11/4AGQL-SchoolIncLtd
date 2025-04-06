const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server-express');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Verify JWT token
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new AuthenticationError('Authentication token is required');
    }
    
    // Remove 'Bearer ' prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    return jwt.verify(tokenValue, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError(`Invalid token: ${error.message}`);
  }
};

// Authentication middleware
const authenticate = (token) => {
  if (!token) {
    return null;
  }
  
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};

// Authorization middleware
const authorize = (user, requiredRole) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in');
  }
  
  if (requiredRole && user.role !== requiredRole) {
    throw new AuthenticationError(`You must be a ${requiredRole} to perform this action`);
  }
  
  return true;
};

module.exports = {
  verifyToken,
  authenticate,
  authorize,
  generateToken: (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  },
};
