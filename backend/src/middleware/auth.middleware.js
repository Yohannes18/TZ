import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const userId = decoded.userId ?? decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    const client = await pool.connect();

    try {
      const result = await client.query('SELECT id, email, name, role FROM users WHERE id = $1', [userId]);
      req.user = result.rows[0];

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } finally {
      client.release();
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Token verification error:', error);
    }

    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
