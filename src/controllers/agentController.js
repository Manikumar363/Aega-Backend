import crypto from 'crypto';
import User from '../models/user.js';
import AgentProfile from '../models/agentProfile.js';
import { sendAgentCredentialsEmail } from '../utils/mailer.js';
import University from '../models/university.js';
import UniversityRequest from '../models/universityRequest.js';

const normalizeText = (value) => String(value || '').trim();

const defaultAuthorization = {
  addAgent: false,
  editAgent: false,
  assignUni: false,
  addOffice: false,
  editOffice: false,
  removeOffice: false,
  assignRegion: false,
  assignCourse: false,
  removeAgent: false
};

const generatePassword = () => {
  const base = crypto.randomBytes(8).toString('base64url').slice(0, 10);
  return `${base}#9aA`;
};

const normalizeAuthorization = (authorizationPayload, existingAuthorization = {}) => {
  const incomingAuthorization = authorizationPayload && typeof authorizationPayload === 'object'
    ? authorizationPayload
    : {};

  return {
    ...defaultAuthorization,
    ...existingAuthorization,
    ...Object.fromEntries(
      Object.entries(incomingAuthorization).map(([key, value]) => [key, Boolean(value)])
    )
  };
};

export const createUniversityRequest = async (req, res) => {
  try {
    const universityId = normalizeText(req.body.universityId);
    const universityName = normalizeText(req.body.name || req.body.universityName);
    const email = normalizeText(req.body.email || req.body.universityEmail).toLowerCase();
    const phone = normalizeText(req.body.mobile || req.body.phone);
    const location = normalizeText(req.body.location);
    const message = normalizeText(req.body.message || req.body.note);

    if (!universityId && !universityName) {
      return res.status(400).json({ error: 'universityId or name is required.' });
    }

    let university = universityId
      ? await University.findById(universityId)
      : await University.findOne({ name: universityName });

    if (!university && email) {
      // Check duplicate email
      const existingUni = await University.findOne({ email });
      const existingUser = await User.findOne({ email });
      if (existingUni || existingUser) {
        return res.status(409).json({ error: 'Company already exist with this emailid' });
      }

      // Create linked user
      const tempPassword = `UniPass@${Math.floor(1000 + Math.random() * 9000)}`;
      const newUser = new User({
        name: universityName,
        email,
        phone: phone || null,
        password: tempPassword,
        role: 'university'
      });
      await newUser.save();

      university = new University({
        userId: newUser._id,
        createdBy: req.user.id,
        name: universityName,
        email,
        phone: phone || null,
        city: location || null,
        country: 'United Kingdom'
      });
      await university.save();
    }

    if (!university) {
      return res.status(400).json({ error: 'Please provide university email to create a new university.' });
    }

    const existingPending = await UniversityRequest.findOne({
      agentId: req.user.id,
      universityId: university._id,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(409).json({ error: 'A pending request already exists for this university.' });
    }

    const universityRequest = new UniversityRequest({
      agentId: req.user.id,
      agentRole: req.user.role,
      agentBusinessType: req.user.businessType || null,
      universityId: university._id,
      universityName: university.name,
      universityEmail: university.email,
      message: message || null
    });

    await universityRequest.save();

    return res.status(201).json({
      message: 'University added successfully.',
      university,
      request: universityRequest
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Company already exist with this emailid' });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const getMyUniversityRequestById = async (req, res) => {
  try {
    const request = await UniversityRequest.findOne({
      _id: req.params.requestId,
      agentId: req.user.id
    })
      .populate('universityId', 'name email region country city logo status complianceScore numberOfAudits activeAlerts riskLevel')
      .lean();

    if (!request) {
      return res.status(404).json({ error: 'University request not found.' });
    }

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteMyUniversityRequest = async (req, res) => {
  try {
    const request = await UniversityRequest.findOne({
      _id: req.params.requestId,
      agentId: req.user.id
    });

    if (!request) {
      return res.status(404).json({ error: 'University request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be deleted.' });
    }

    await UniversityRequest.deleteOne({ _id: request._id });

    return res.json({ message: 'University request deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyUniversityRequests = async (req, res) => {
  try {
    const requests = await UniversityRequest.find({ agentId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('universityId', 'name email region country city logo status complianceScore numberOfAudits activeAlerts riskLevel')
      .lean();

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUniversityRequestsForUniversity = async (req, res) => {
  try {
    const university = await University.findOne({ userId: req.user.id });
    if (!university) {
      return res.status(404).json({ error: 'University profile not found.' });
    }

    const requests = await UniversityRequest.find({ universityId: university._id })
      .sort({ createdAt: -1 })
      .populate('agentId', 'name email role businessType createdAt')
      .lean();

    const agentIds = requests.map(r => r.agentId?._id || r.agentId).filter(Boolean);
    const agentProfiles = await AgentProfile.find({ userId: { $in: agentIds } })
      .select('userId complianceScore numberOfAudits activeAlerts riskLevel')
      .lean();

    const profileMap = new Map(agentProfiles.map(p => [String(p.userId), p]));

    const enrichedRequests = requests.map(request => {
      const agentIdStr = String(request.agentId?._id || request.agentId);
      const profile = profileMap.get(agentIdStr);
      return {
        ...request,
        agentProfile: profile ? {
          id: profile._id,
          complianceScore: profile.complianceScore ?? 100,
          numberOfAudits: profile.numberOfAudits ?? 0,
          activeAlerts: profile.activeAlerts ?? 0,
          riskLevel: profile.riskLevel || 'LOW'
        } : null
      };
    });

    return res.json(enrichedRequests);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyUniversityRequestsForAgent = async (req, res) => {
  try {
    const requests = await UniversityRequest.find({ agentId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('universityId', 'name email region country city logo status complianceScore numberOfAudits activeAlerts riskLevel')
      .lean();

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const reviewUniversityRequest = async (req, res, status) => {
  try {
    const university = await University.findOne({ userId: req.user.id });
    if (!university) {
      return res.status(404).json({ error: 'University profile not found.' });
    }

    const universityRequest = await UniversityRequest.findOne({
      _id: req.params.requestId,
      universityId: university._id
    });

    if (!universityRequest) {
      return res.status(404).json({ error: 'University request not found.' });
    }

    if (universityRequest.status !== 'pending') {
      return res.status(400).json({ error: 'University request has already been reviewed.' });
    }

    universityRequest.status = status;
    universityRequest.reviewNote = normalizeText(req.body.reviewNote) || null;
    universityRequest.reviewedBy = req.user.id;
    universityRequest.reviewedAt = new Date();
    universityRequest.updatedAt = new Date();

    await universityRequest.save();

    return res.json({
      message: `University request ${status} successfully.`,
      request: universityRequest
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const acceptUniversityRequest = async (req, res) => reviewUniversityRequest(req, res, 'accepted');

export const rejectUniversityRequest = async (req, res) => reviewUniversityRequest(req, res, 'rejected');

export const createAgent = async (req, res) => {
  try {
    const rawFullName = normalizeText(req.body.fullName || req.body.name || req.body.companyName || req.body.firstName);
    const nameParts = rawFullName ? rawFullName.split(' ') : [];
    const firstName = nameParts[0] || rawFullName || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      fullName: rawFullName,
      firstName,
      lastName,
      emailId: normalizeText(req.body.emailId || req.body.email).toLowerCase(),
      mobileNumber: normalizeText(req.body.mobileNumber || req.body.mobile),
      designation: normalizeText(req.body.designation),
      office: normalizeText(req.body.office),
      country: normalizeText(req.body.country)
    };

    if (!payload.fullName || !payload.emailId || !payload.mobileNumber || !payload.designation || !payload.office || !payload.country) {
      return res.status(400).json({ error: 'Please fill in all mandatory fields.' });
    }

    const existingUser = await User.findOne({ email: payload.emailId });
    if (existingUser) {
      return res.status(409).json({ error: 'Agent already exist with this emailid' });
    }

    const authorization = normalizeAuthorization(req.body.authorization);

    const generatedPassword = generatePassword();

    const user = new User({
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: payload.fullName,
      email: payload.emailId,
      password: generatedPassword,
      role: 'agent',
      businessType: req.user.businessType || null
    });

    await user.save();

    const profile = new AgentProfile({
      userId: user._id,
      fullName: payload.fullName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      emailId: payload.emailId,
      mobileNumber: payload.mobileNumber,
      designation: payload.designation,
      office: payload.office,
      country: payload.country,
      authorization,
      createdBy: req.user.id
    });

    await profile.save();

    console.log('New agent credentials:', {
      email: payload.emailId,
      password: generatedPassword
    });

    let emailSent = true;
    let emailError = null;

    try {
      await Promise.race([
        sendAgentCredentialsEmail({
          email: payload.emailId,
          fullName: payload.fullName,
          password: generatedPassword
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email send timeout')), 2500))
      ]);
    } catch (error) {
      emailSent = false;
      emailError = error.message;
    }

    const baseResponse = {
      message: 'Agent added successfully',
      agent: {
        id: profile._id,
        userId: user._id,
        fullName: profile.fullName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailId: profile.emailId,
        mobileNumber: profile.mobileNumber,
        designation: profile.designation,
        office: profile.office,
        country: profile.country,
        authorization: profile.authorization,
        complianceScore: profile.complianceScore !== undefined ? profile.complianceScore : 100,
        numberOfAudits: profile.numberOfAudits !== undefined ? profile.numberOfAudits : 0,
        activeAlerts: profile.activeAlerts !== undefined ? profile.activeAlerts : 0,
        riskLevel: profile.riskLevel || 'LOW'
      },
      credentials: {
        email: payload.emailId,
        password: generatedPassword
      },
      email: {
        sent: emailSent,
        error: emailError
      }
    };

    return res.status(201).json(baseResponse);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const buildAgentResponse = (profile, user) => {
  const nameStr = profile.fullName || user?.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Agent';
  return {
    id: profile._id,
    userId: user?._id || profile.userId,
    fullName: nameStr,
    name: nameStr,
    firstName: profile.firstName || nameStr,
    lastName: profile.lastName || '',
    emailId: profile.emailId,
    mobileNumber: profile.mobileNumber,
    designation: profile.designation,
    office: profile.office,
    country: profile.country,
    authorization: profile.authorization,
    complianceScore: profile.complianceScore !== undefined ? profile.complianceScore : 100,
    numberOfAudits: profile.numberOfAudits !== undefined ? profile.numberOfAudits : 0,
    activeAlerts: profile.activeAlerts !== undefined ? profile.activeAlerts : 0,
    riskLevel: profile.riskLevel || 'LOW',
    createdAt: profile.createdAt,
    createdBy: profile.createdBy,
    user: user
      ? {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          avatar: user.avatar || user.profilePic || null
        }
      : null
  };
};

export const getAgents = async (req, res) => {
  try {
    const agents = await AgentProfile.find({
      createdBy: req.user.id,
      userId: { $ne: req.user.id }
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role avatar profilePic createdAt');

    return res.json(
      agents.map((agent) => buildAgentResponse(agent, agent.userId))
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAgentById = async (req, res) => {
  try {
    const agent = await AgentProfile.findOne({ _id: req.params.agentId, createdBy: req.user.id })
      .populate('userId', 'name email role createdAt');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    return res.json(buildAgentResponse(agent, agent.userId));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateAgent = async (req, res) => {
  try {
    const agent = await AgentProfile.findOne({ _id: req.params.agentId, createdBy: req.user.id });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    const user = await User.findById(agent.userId);
    if (!user) {
      return res.status(404).json({ error: 'Linked user account not found.' });
    }

    const nextEmail = normalizeText(req.body.emailId || req.body.email).toLowerCase() || agent.emailId;
    const emailOwner = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (emailOwner) {
      return res.status(409).json({ error: 'Another user already exists with this email.' });
    }

    const rawFullName = normalizeText(req.body.fullName || req.body.name || req.body.companyName || req.body.firstName);
    let nextFirstName = agent.firstName;
    let nextLastName = agent.lastName;
    let nextFullName = agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim();

    if (rawFullName) {
      nextFullName = rawFullName;
      const parts = rawFullName.split(' ');
      nextFirstName = parts[0] || rawFullName;
      nextLastName = parts.slice(1).join(' ') || '';
    }

    agent.fullName = nextFullName;
    agent.firstName = nextFirstName;
    agent.lastName = nextLastName;
    agent.emailId = nextEmail;
    agent.mobileNumber = normalizeText(req.body.mobileNumber || req.body.mobile) || agent.mobileNumber;
    agent.designation = normalizeText(req.body.designation) || agent.designation;
    agent.office = normalizeText(req.body.office) || agent.office;
    agent.country = normalizeText(req.body.country) || agent.country;
    agent.authorization = normalizeAuthorization(req.body.authorization, agent.authorization.toObject?.() || agent.authorization);

    user.firstName = nextFirstName;
    user.lastName = nextLastName;
    user.name = nextFullName;
    user.email = nextEmail;

    await user.save();
    await agent.save();

    const updatedUser = await User.findById(user._id).select('name email role createdAt');

    return res.json({
      message: 'Agent updated successfully.',
      agent: buildAgentResponse(agent, updatedUser)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const agent = await AgentProfile.findOne({ _id: req.params.agentId, createdBy: req.user.id });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    await Promise.all([
      AgentProfile.deleteOne({ _id: agent._id }),
      User.deleteOne({ _id: agent.userId })
    ]);

    return res.json({ message: 'Agent deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllAgentsForAdmin = async (req, res) => {
  try {
    // Self-healing: Ensure AgentProfile documents exist for all users with role 'agent'
    const agentUsers = await User.find({ role: 'agent' });
    for (const user of agentUsers) {
      const profileExists = await AgentProfile.exists({ userId: user._id });
      if (!profileExists) {
        const parts = (user.name || '').split(' ');
        const firstName = user.firstName || parts[0] || 'Agent';
        const lastName = user.lastName || parts.slice(1).join(' ') || 'User';

        await AgentProfile.create({
          userId: user._id,
          firstName,
          lastName,
          emailId: user.email,
          mobileNumber: '+0 000 000 0000',
          designation: user.businessType === 'b2b' ? 'B2B Owner' : 'Agent',
          office: 'HQ',
          country: 'Not Specified',
          createdBy: user._id,
          complianceScore: 100,
          numberOfAudits: 0,
          activeAlerts: 0,
          riskLevel: 'LOW'
        });
      }
    }

    const queryFilter = {};
    if (req.query.createdBy) {
      queryFilter.createdBy = req.query.createdBy;
    }

    const agents = await AgentProfile.find(queryFilter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role businessType createdAt')
      .populate('createdBy', 'name email role businessType');

    return res.json(
      agents.map((agent) => buildAgentResponse(agent, agent.userId))
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAgentByIdForAdmin = async (req, res) => {
  try {
    const agent = await AgentProfile.findById(req.params.agentId)
      .populate('userId', 'name email role businessType createdAt')
      .populate('createdBy', 'name email role businessType');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    return res.json(buildAgentResponse(agent, agent.userId));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const adminUpdateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await AgentProfile.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    const user = await User.findById(agent.userId);
    if (!user) {
      return res.status(404).json({ error: 'Linked user account not found.' });
    }

    const nextEmail = normalizeText(req.body.emailId).toLowerCase() || agent.emailId;
    const emailOwner = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (emailOwner) {
      return res.status(409).json({ error: 'Another user already exists with this email.' });
    }

    const nextFirstName = normalizeText(req.body.firstName) || agent.firstName;
    const nextLastName = normalizeText(req.body.lastName) || agent.lastName;

    agent.firstName = nextFirstName;
    agent.lastName = nextLastName;
    agent.emailId = nextEmail;
    agent.mobileNumber = normalizeText(req.body.mobileNumber) || agent.mobileNumber;
    agent.designation = normalizeText(req.body.designation) || agent.designation;
    agent.office = normalizeText(req.body.office) || agent.office;
    agent.country = normalizeText(req.body.country) || agent.country;
    if (req.body.authorization) {
      agent.authorization = normalizeAuthorization(req.body.authorization, agent.authorization.toObject?.() || agent.authorization);
    }

    user.firstName = nextFirstName;
    user.lastName = nextLastName;
    user.name = `${nextFirstName} ${nextLastName}`.trim();
    user.email = nextEmail;
    user.phone = agent.mobileNumber;
    user.country = agent.country;
    user.city = agent.office;

    await user.save();
    await agent.save();

    const updatedUser = await User.findById(user._id).select('name email role createdAt');

    return res.json({
      message: 'Agent updated successfully.',
      agent: buildAgentResponse(agent, updatedUser)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const adminDeleteAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await AgentProfile.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    await Promise.all([
      AgentProfile.deleteOne({ _id: agent._id }),
      User.deleteOne({ _id: agent.userId }),
      Company.deleteMany({ agentId: agent.userId })
    ]);

    return res.json({ message: 'Agent deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};