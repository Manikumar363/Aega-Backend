import Company from '../models/company.js';
import User from '../models/user.js';
import AgentProfile from '../models/agentProfile.js';
import { sendAgentCredentialsEmail } from '../utils/mailer.js';

const normalizeField = (value) => String(value || '').trim();
const matrixKeys = [
  'visaRefusal',
  'enrollment',
  'withdrawnStudent',
  'withdrawnPayment',
  'academicWithdrawn',
  'studentOutputSuccess'
];

const getMissingFields = (payload) => {
  const requiredFields = [
    'companyName',
    'founderName',
    'emailId',
    'mobileNumber',
    'designation',
    'office',
    'country',
    'companyDocument1',
    'companyDocument2'
  ];

  return requiredFields.filter((field) => !normalizeField(payload[field]));
};

export const createCompany = async (req, res) => {
  try {
    const companyData = {
      companyName: normalizeField(req.body.companyName),
      founderName: normalizeField(req.body.founderName),
      emailId: normalizeField(req.body.emailId).toLowerCase(),
      mobileNumber: normalizeField(req.body.mobileNumber),
      designation: normalizeField(req.body.designation),
      office: normalizeField(req.body.office),
      country: normalizeField(req.body.country),
      companyDocument1: normalizeField(req.body.companyDocument1),
      companyDocument2: normalizeField(req.body.companyDocument2),
      agentId: req.user.id
    };

    const missingFields = getMissingFields(companyData);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Duplicate email check across User and Company collections
    const existingCompany = await Company.findOne({ emailId: companyData.emailId });
    const existingUser = await User.findOne({ email: companyData.emailId });

    if (existingCompany || existingUser) {
      return res.status(400).json({
        error: 'Company already exist with this emailid'
      });
    }

    // Auto-generate temp password
    const tempPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;

    // Create linked User account for company
    const user = new User({
      companyName: companyData.companyName,
      name: companyData.companyName,
      firstName: companyData.founderName,
      email: companyData.emailId,
      phone: companyData.mobileNumber,
      password: tempPassword,
      role: 'agent',
      businessType: 'b2b'
    });
    await user.save();

    const company = new Company(companyData);
    await company.save();

    // Send credentials email
    try {
      await sendAgentCredentialsEmail({
        email: companyData.emailId,
        fullName: companyData.founderName || companyData.companyName,
        password: tempPassword
      });
    } catch (emailErr) {
      console.error('Failed to send credentials email:', emailErr.message);
    }

    return res.status(201).json({
      message: 'Company added successfully',
      company,
      credentials: {
        email: companyData.emailId,
        password: tempPassword
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Company already exist with this emailid' });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const isAdmin = ['admin', 'sponsor'].includes(req.user.role);
    const query = isAdmin ? {} : { agentId: req.user.id };
    
    // Fetch Company records
    const companies = await Company.find(query).sort({ createdAt: -1 });
    
    if (isAdmin) {
      // Fetch B2B/B2C User agents that act as companies
      const users = await User.find({ role: 'agent', businessType: { $in: ['b2b', 'b2c'] } }).sort({ createdAt: -1 });
      
      const normalizedUsers = users.map((u) => ({
        _id: u._id,
        companyName: u.companyName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name,
        founderName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name,
        emailId: u.email,
        mobileNumber: u.phone || 'N/A',
        designation: u.businessType === 'b2c' ? 'B2C' : 'B2B',
        office: u.city || u.state || 'N/A',
        country: u.country || 'N/A',
        profileImage: u.profileImage || null,
        isUserAgent: true,
        createdAt: u.createdAt
      }));

      const normalizedCompanies = companies.map((c) => ({
        _id: c._id,
        companyName: c.companyName,
        founderName: c.founderName,
        emailId: c.emailId,
        mobileNumber: c.mobileNumber,
        designation: c.designation || 'B2B',
        office: c.office,
        country: c.country,
        profileImage: null,
        isUserAgent: false,
        createdAt: c.createdAt
      }));

      // Merge and sort by createdAt descending
      const merged = [...normalizedCompanies, ...normalizedUsers].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return res.json(merged);
    }

    return res.json(companies);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCompanyOverview = async (req, res) => {
  try {
    let company = await Company.findById(req.params.companyId)
      .populate('agentId', 'firstName lastName name email role businessType');

    if (!company) {
      // Fallback: check if it's a B2B/B2C agent User
      const user = await User.findById(req.params.companyId);
      if (!user || user.role !== 'agent' || !['b2b', 'b2c'].includes(user.businessType)) {
        return res.status(404).json({ error: 'Company not found.' });
      }

      return res.json({
        info: {
          id: user._id,
          companyName: user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
          founderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
          emailId: user.email,
          mobileNumber: user.phone || 'N/A',
          designation: user.businessType === 'b2c' ? 'B2C' : 'B2B',
          office: user.city || user.state || 'N/A',
          country: user.country || 'N/A',
          profileImage: user.profileImage || null,
          createdAt: user.createdAt
        },
        agent: user,
        performanceMatrix: null
      });
    }

    const isAdmin = ['admin', 'sponsor'].includes(req.user.role);
    const isOwnerAgent = String(company.agentId?._id || company.agentId) === String(req.user.id);
    if (!isAdmin && !isOwnerAgent) {
      return res.status(403).json({ error: 'You do not have access to this company.' });
    }

    return res.json({
      info: {
        id: company._id,
        companyName: company.companyName,
        founderName: company.founderName,
        emailId: company.emailId,
        mobileNumber: company.mobileNumber,
        designation: company.designation || 'B2B',
        office: company.office,
        country: company.country,
        companyDocument1: company.companyDocument1,
        companyDocument2: company.companyDocument2,
        createdAt: company.createdAt
      },
      agent: company.agentId,
      performanceMatrix: company.performanceMatrix
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCompanyByIdForAdmin = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .populate('agentId', 'firstName lastName name email role businessType');

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    return res.json({
      info: {
        id: company._id,
        companyName: company.companyName,
        founderName: company.founderName,
        emailId: company.emailId,
        mobileNumber: company.mobileNumber,
        designation: company.designation,
        office: company.office,
        country: company.country,
        companyDocument1: company.companyDocument1,
        companyDocument2: company.companyDocument2,
        createdAt: company.createdAt
      },
      agent: company.agentId,
      performanceMatrix: company.performanceMatrix
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCompanyPerformance = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const incomingMatrix = req.body.performanceMatrix;
    if (!incomingMatrix || typeof incomingMatrix !== 'object') {
      return res.status(400).json({ error: 'performanceMatrix object is required.' });
    }

    for (const key of matrixKeys) {
      if (!incomingMatrix[key]) {
        continue;
      }

      const current = company.performanceMatrix[key] || {};
      const next = incomingMatrix[key];
      company.performanceMatrix[key] = {
        weekly: Number.isFinite(next.weekly) ? next.weekly : current.weekly,
        monthly: Number.isFinite(next.monthly) ? next.monthly : current.monthly,
        yearly: Number.isFinite(next.yearly) ? next.yearly : current.yearly,
        max: Number.isFinite(next.max) ? next.max : current.max
      };
    }

    await company.save();
    return res.json({
      message: 'Performance matrix updated successfully.',
      performanceMatrix: company.performanceMatrix
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const adminUpdateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    let company = await Company.findById(companyId);
    if (!company) {
      // Fallback: check if B2B/B2C user agent
      const user = await User.findById(companyId);
      if (user && user.role === 'agent' && ['b2b', 'b2c'].includes(user.businessType)) {
        const name = normalizeField(req.body.founderName || req.body.companyName);
        const nextFirstName = name.split(' ')[0] || user.firstName;
        const nextLastName = name.split(' ').slice(1).join(' ') || user.lastName;
        
        user.firstName = nextFirstName;
        user.lastName = nextLastName;
        user.name = name || user.name;
        user.email = normalizeField(req.body.emailId) || user.email;
        user.phone = normalizeField(req.body.mobileNumber) || user.phone;
        user.country = normalizeField(req.body.country) || user.country;
        user.city = normalizeField(req.body.office) || user.city;
        user.companyName = normalizeField(req.body.companyName) || user.companyName;
        
        await user.save();
        
        // Also update AgentProfile if it exists to keep in sync
        const profile = await AgentProfile.findOne({ userId: user._id });
        if (profile) {
          profile.firstName = nextFirstName;
          profile.lastName = nextLastName;
          profile.emailId = user.email;
          profile.mobileNumber = user.phone;
          profile.country = user.country;
          profile.office = user.city;
          await profile.save();
        }
        
        return res.json({ success: true, message: 'Company Agent updated successfully.', data: user });
      }
      return res.status(404).json({ error: 'Company not found.' });
    }

    company.companyName = normalizeField(req.body.companyName) || company.companyName;
    company.founderName = normalizeField(req.body.founderName) || company.founderName;
    company.emailId = normalizeField(req.body.emailId) || company.emailId;
    company.mobileNumber = normalizeField(req.body.mobileNumber) || company.mobileNumber;
    company.designation = normalizeField(req.body.designation) || company.designation;
    company.office = normalizeField(req.body.office) || company.office;
    company.country = normalizeField(req.body.country) || company.country;

    await company.save();

    if (company.agentId) {
      const user = await User.findById(company.agentId);
      if (user) {
        const name = company.founderName || company.companyName;
        const nextFirstName = name.split(' ')[0] || user.firstName;
        const nextLastName = name.split(' ').slice(1).join(' ') || user.lastName;

        user.firstName = nextFirstName;
        user.lastName = nextLastName;
        user.name = name || user.name;
        user.email = company.emailId || user.email;
        user.phone = company.mobileNumber || user.phone;
        user.country = company.country || user.country;
        user.city = company.office || user.city;
        user.companyName = company.companyName || user.companyName;

        await user.save();

        const profile = await AgentProfile.findOne({ userId: user._id });
        if (profile) {
          profile.firstName = nextFirstName;
          profile.lastName = nextLastName;
          profile.emailId = user.email;
          profile.mobileNumber = user.phone;
          profile.country = user.country;
          profile.office = user.city;
          await profile.save();
        }
      }
    }

    return res.json({ success: true, message: 'Company updated successfully.', data: company });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const adminDeleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    let company = await Company.findById(companyId);
    if (!company) {
      // Fallback: check if B2B/B2C user agent
      const user = await User.findById(companyId);
      if (user && user.role === 'agent' && ['b2b', 'b2c'].includes(user.businessType)) {
        await Promise.all([
          User.deleteOne({ _id: user._id }),
          AgentProfile.deleteOne({ userId: user._id }),
          Company.deleteMany({ agentId: user._id })
        ]);
        return res.json({ message: 'Company Agent deleted successfully.' });
      }
      return res.status(404).json({ error: 'Company not found.' });
    }

    if (company.agentId) {
      await Promise.all([
        User.deleteOne({ _id: company.agentId }),
        AgentProfile.deleteOne({ userId: company.agentId })
      ]);
    }

    await Company.deleteOne({ _id: company._id });
    return res.json({ message: 'Company deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};