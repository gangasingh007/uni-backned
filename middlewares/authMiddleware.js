import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authMiddleware = (req, res, next) => {
  // Access the authorization header (lowercase for Express compatibility)
  const authHeader = req.headers.authorization;

  // Check if the header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: { message: 'No token provided' } });
  }

  // Extract token from 'Bearer <token>'
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ error: { message: 'Malformed token' } });
  }

  // Check if JWT_SECRET is defined
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate decoded token structure
    if (!decoded.id) {
      return res.status(401).json({ error: { message: 'Invalid token payload' } });
    }

    // Attach userId to the request object
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
};