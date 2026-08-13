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
  if (!req.user || (req.user.role !== 'agent' && req.user.role !== 'counsellor')) {
    return res.status(403).json({ error: 'Agent access required.' });
  }

  return next();
};

export const requireCounsellorRole = (req, res, next) => {
  if (!req.user || (req.user.role !== 'counsellor' && req.user.role !== 'agent')) {
    return res.status(403).json({ error: 'Counsellor or agent access required.' });
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

export const requireAgentOrAdminRole = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'agent' && role !== 'admin') {
    return res.status(403).json({ error: 'Agent or admin access required.' });
  }

  return next();
};

export const requireUniversityManagementAccess = (req, res, next) => {
  const role = req.user?.role;

  if (role === 'admin' || role === 'counsellor') {
    return next();
  }

  if (role === 'agent' && ['b2b', 'b2c'].includes(req.user?.businessType)) {
    return next();
  }

  return res.status(403).json({ error: 'Agent b2b/b2c or counsellor access required.' });
};

export const requireAgentManagementPermission = (permissionKey) => async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'agent' && req.user.role !== 'counsellor')) {
      return res.status(403).json({ error: 'Agent or Counsellor access required.' });
    }

    const profile = await AgentProfile.findOne({ userId: req.user.id });
    // Controller agents without a profile treat as top-level managers
    if (!profile) {
      return next();
    }

    // Top-level owners have all permissions
    if (!profile.createdBy || String(profile.createdBy) === String(profile.userId)) {
      req.agentProfile = profile;
      return next();
    }

    // Check specific granted authorization permission
    if (permissionKey && profile.authorization && profile.authorization[permissionKey] === true) {
      req.agentProfile = profile;
      return next();
    }

    if (permissionKey && (!profile.authorization || !profile.authorization[permissionKey])) {
      return res.status(403).json({ error: `You do not have permission for this action (${permissionKey}).` });
    }

    req.agentProfile = profile;
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const requireUniversityRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'university') {
    return res.status(403).json({ error: 'University access required.' });
  }

  return next();
};