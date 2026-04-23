import jwt from 'jsonwebtoken';
import AgentProfile from '../models/agentProfile.js';

export const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authorization token is required.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireAgentRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Agent access required.' });
  }

  return next();
};

export const requireAdminRole = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  return next();
};

export const requireAgentManagementPermission = (permissionKey) => async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Agent access required.' });
    }

    if (!['b2b', 'b2c'].includes(req.user.businessType)) {
      return res.status(403).json({ error: 'B2B or B2C agent access required.' });
    }

    const profile = await AgentProfile.findOne({ userId: req.user.id });
    // Controller agents might not have an AgentProfile record.
    // In that case, allow access and treat them as top-level managers.
    if (!profile) {
      return next();
    }

    if (!profile.authorization || !profile.authorization[permissionKey]) {
      return res.status(403).json({ error: 'You do not have permission for this action.' });
    }

    req.agentProfile = profile;
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};