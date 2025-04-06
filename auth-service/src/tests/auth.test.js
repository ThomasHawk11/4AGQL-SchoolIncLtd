const jwt = require('jsonwebtoken');
const { verifyToken, authenticate, authorize } = require('../utils/auth');

jest.mock('jsonwebtoken');

describe('Auth Utils', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'student',
  };

  const mockToken = 'valid.jwt.token';
  const mockBearerToken = `Bearer ${mockToken}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      jwt.verify.mockReturnValue(mockUser);
      
      const result = verifyToken(mockToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toEqual(mockUser);
    });

    it('should verify a valid bearer token', () => {
      jwt.verify.mockReturnValue(mockUser);
      
      const result = verifyToken(mockBearerToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toEqual(mockUser);
    });

    it('should throw an error for missing token', () => {
      expect(() => verifyToken(null)).toThrow('Authentication token is required');
    });

    it('should throw an error for invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      expect(() => verifyToken(mockToken)).toThrow('Invalid token');
    });
  });

  describe('authorize', () => {
    it('should authorize a user with correct role', () => {
      const result = authorize(mockUser, 'student');
      
      expect(result).toBe(true);
    });

    it('should authorize a user when no role is required', () => {
      const result = authorize(mockUser);
      
      expect(result).toBe(true);
    });

    it('should throw an error when user is not logged in', () => {
      expect(() => authorize(null)).toThrow('You must be logged in');
    });

    it('should throw an error when user has incorrect role', () => {
      expect(() => authorize(mockUser, 'professor')).toThrow('You must be a professor to perform this action');
    });
  });
});
