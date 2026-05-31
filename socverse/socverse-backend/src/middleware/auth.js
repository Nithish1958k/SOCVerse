import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

// Verifies the Bearer token and attaches req.user (lean document).
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User no longer active' });
    }

    req.user = user;
    req.auth = { id: String(user._id), role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

// Signs a JWT for a given user document.
export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
