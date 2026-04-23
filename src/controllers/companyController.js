import Company from '../models/company.js';

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
      emailId: normalizeField(req.body.emailId),
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

    const company = new Company(companyData);
    await company.save();

    return res.status(201).json({
      message: 'Company created successfully.',
      company
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const isAdmin = ['admin', 'sponsor'].includes(req.user.role);
    const query = isAdmin ? {} : { agentId: req.user.id };
    const companies = await Company.find(query).sort({ createdAt: -1 });
    return res.json(companies);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCompanyOverview = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .populate('agentId', 'firstName lastName name email role businessType');

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
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