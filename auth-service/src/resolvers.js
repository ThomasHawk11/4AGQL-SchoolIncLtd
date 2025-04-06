const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const db = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const resolvers = {
  Query: {
    verifyToken: async (_, { token }) => {
      try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find the user
        const user = await db.User.findByPk(decoded.id);
        
        if (!user) {
          throw new AuthenticationError('User not found');
        }
        
        return user;
      } catch (error) {
        throw new AuthenticationError('Invalid token');
      }
    },
  },
  
  Mutation: {
    register: async (_, { email, pseudo, password, role }) => {
      try {
        // Check if user already exists
        const existingUser = await db.User.findOne({ where: { email } });
        
        if (existingUser) {
          throw new UserInputError('Email already in use');
        }
        
        // Create new user
        const user = await db.User.create({
          email,
          pseudo,
          password,
          role,
        });
        
        // Generate token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return {
          token,
          user,
        };
      } catch (error) {
        if (error.name === 'UserInputError') {
          throw error;
        }
        throw new Error(`Registration failed: ${error.message}`);
      }
    },
    
    login: async (_, { email, password }) => {
      try {
        // Find user by email
        const user = await db.User.findOne({ where: { email } });
        
        if (!user) {
          throw new AuthenticationError('Invalid email or password');
        }
        
        // Check password
        const validPassword = await user.checkPassword(password);
        
        if (!validPassword) {
          throw new AuthenticationError('Invalid email or password');
        }
        
        // Generate token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return {
          token,
          user,
        };
      } catch (error) {
        if (error.name === 'AuthenticationError') {
          throw error;
        }
        throw new Error(`Login failed: ${error.message}`);
      }
    },
  },
};

module.exports = resolvers;
