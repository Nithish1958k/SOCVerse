import { ROLE_RANK } from '../utils/constants.js';

// Allow only if the user's role is in the explicit allow-list.
// Usage: router.post('/', authenticate, requireRole('L3', 'Manager'), handler)
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role ${req.user.role} cannot perform this action`,
        requiredAny: allowed,
      });
    }
    return next();
  };
}

// Allow if the user's role rank meets or exceeds a minimum tier.
// Usage: requireMinRole('L2') lets L2, L3, Manager through.
export function requireMinRole(minRole) {
  const min = ROLE_RANK[minRole] || 0;
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if ((ROLE_RANK[req.user.role] || 0) < min) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires at least ${minRole} privileges`,
      });
    }
    return next();
  };
}
