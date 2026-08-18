import PolicyContent from '../models/policyContent.js';

const DEFAULT_POLICIES = [
  {
    key: 'privacy',
    title: 'Privacy Policy',
    description: 'Outlines how AEGA collects, utilizes, and secures user data.',
    content: 'AEGA is committed to protecting the privacy of our students, agents, and university partners. This policy details our data collection practices, the security measures we employ, and how you can exercise your privacy rights.'
  },
  {
    key: 'website',
    title: 'Website Policy',
    description: 'Standard usage guidelines for visiting and interacting with the AEGA platform.',
    content: 'By accessing and utilizing the AEGA platform, you consent to comply with our website policies. This includes guidelines on acceptable usage, prohibited behaviors, and intellectual property ownership.'
  },
  {
    key: 'terms',
    title: 'Terms of Use',
    description: 'The legal agreement governing membership, user obligations, and platform usage.',
    content: 'These Terms of Use govern your access to the services, databases, and portal systems provided by AEGA. Users are responsible for maintaining confidentiality of credentials and ensuring lawful compliance.'
  },
  {
    key: 'conduct',
    title: 'Code of Conduct',
    description: 'Ethical standards and compliance metrics required for all AEGA members.',
    content: 'Our Code of Conduct defines the professional integrity, transparency, and ethical recruitment standards expected from all certified educational agents and institutional sponsors.'
  },
  {
    key: 'confidentiality',
    title: 'Confidentiality Policy',
    description: 'Data protection standards for handling sensitive student and corporate data.',
    content: 'Sponsors and agents must handle all student records, personal identifiers, and visa document uploads with absolute confidentiality. Unsanctioned disclosure of user data is strictly prohibited.'
  },
  {
    key: 'gdpr',
    title: 'GDPR Policy',
    description: 'Strict adherence protocols for handling European Union student data.',
    content: 'In compliance with the General Data Protection Regulation (GDPR), AEGA guarantees EU citizens complete transparency, data access rights, and the right to be forgotten. This policy explains our compliance framework.'
  }
];

const getOrSeedPolicyContent = async () => {
  let doc = await PolicyContent.findOne();
  if (!doc) {
    doc = new PolicyContent({
      policies: DEFAULT_POLICIES
    });
    await doc.save();
  }
  return doc;
};

// GET: Fetch Policy Content
export const getPolicyContent = async (req, res) => {
  try {
    const doc = await getOrSeedPolicyContent();
    return res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PUT: Update Policy Content (Admin Only)
export const updatePolicyContent = async (req, res) => {
  try {
    const { policies } = req.body;

    if (!policies || !Array.isArray(policies)) {
      return res.status(400).json({
        success: false,
        error: 'Policies list is required and must be an array.'
      });
    }

    let doc = await PolicyContent.findOne();
    if (!doc) {
      doc = new PolicyContent({ policies });
    } else {
      doc.policies = policies;
      doc.updatedAt = new Date();
    }

    await doc.save();

    return res.status(200).json({
      success: true,
      data: doc,
      message: 'Policy content updated successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
