import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (role && !ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const user = new User({ name, email, role: role || 'L1' });
  await user.setPassword(password);
  await user.save();

  const token = signToken(user);
  return res.status(201).json({ token, user: user.toSafeJSON() });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  return res.json({ token, user: user.toSafeJSON() });
}

// GET /api/auth/me
export async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}
