const jwt = require('jsonwebtoken');
const axios = require('axios');
const { AuthenticationError } = require('apollo-server-express');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

const verifyToken = (token) => {
  try {
    if (!token) {
      throw new AuthenticationError('Authentication token is required');
    }
    
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    return jwt.verify(tokenValue, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError(`Invalid token: ${error.message}`);
  }
};

// Authentication middleware
const authenticate = async (token) => {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verifyToken(token);
    
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/graphql`, {
        query: `
          query VerifyToken($token: String!) {
            verifyToken(token: $token) {
              id
              email
              pseudo
              role
            }
          }
        `,
        variables: {
          token: token.startsWith('Bearer ') ? token.slice(7) : token,
        },
      });
      
      if (response.data.errors) {
        return null;
      }
      
      return response.data.data.verifyToken;
    } catch (error) {
      return decoded;
    }
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
};
