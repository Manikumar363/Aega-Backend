import crypto from 'crypto';
import User from '../models/user.js';
import AgentProfile from '../models/agentProfile.js';
import { sendAgentCredentialsEmail } from '../utils/mailer.js';

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

export const createAgent = async (req, res) => {
  try {
    const payload = {
      firstName: normalizeText(req.body.firstName),
      lastName: normalizeText(req.body.lastName),
      emailId: normalizeText(req.body.emailId).toLowerCase(),
      mobileNumber: normalizeText(req.body.mobileNumber),
      designation: normalizeText(req.body.designation),
      office: normalizeText(req.body.office),
      country: normalizeText(req.body.country)
    };

    const requiredFields = Object.entries(payload)
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (requiredFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${requiredFields.join(', ')}` });
    }

    const existingUser = await User.findOne({ email: payload.emailId });
    if (existingUser) {
      return res.status(409).json({ error: 'Agent already exists with this email.' });
    }

    const authorization = normalizeAuthorization(req.body.authorization);

    const generatedPassword = generatePassword();

    const user = new User({
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: `${payload.firstName} ${payload.lastName}`.trim(),
      email: payload.emailId,
      password: generatedPassword,
      role: 'agent',
      businessType: req.user.businessType || null
    });

    await user.save();

    const profile = new AgentProfile({
      userId: user._id,
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
      await sendAgentCredentialsEmail({
        email: payload.emailId,
        fullName: `${payload.firstName} ${payload.lastName}`.trim(),
        password: generatedPassword
      });
    } catch (error) {
      emailSent = false;
      emailError = error.message;
    }

    return res.status(201).json({
      message: emailSent
        ? 'Agent created successfully and credentials email sent.'
        : 'Agent created successfully, but credential email could not be sent.',
      agent: {
        id: profile._id,
        userId: user._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailId: profile.emailId,
        mobileNumber: profile.mobileNumber,
        designation: profile.designation,
        office: profile.office,
        country: profile.country,
        authorization: profile.authorization
      },
      email: {
        sent: emailSent,
        error: emailError
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const buildAgentResponse = (profile, user) => ({
  id: profile._id,
  userId: user?._id || profile.userId,
  firstName: profile.firstName,
  lastName: profile.lastName,
  emailId: profile.emailId,
  mobileNumber: profile.mobileNumber,
  designation: profile.designation,
  office: profile.office,
  country: profile.country,
  authorization: profile.authorization,
  createdAt: profile.createdAt,
  user: user
    ? {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    : null
});

export const getAgents = async (req, res) => {
  try {
    const agents = await AgentProfile.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role createdAt');

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
    agent.authorization = normalizeAuthorization(req.body.authorization, agent.authorization.toObject?.() || agent.authorization);

    user.firstName = nextFirstName;
    user.lastName = nextLastName;
    user.name = `${nextFirstName} ${nextLastName}`.trim();
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