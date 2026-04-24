import Complaint from '../models/complaint.js';

const normalizeText = (value) => String(value || '').trim();

const normalizeEvidenceFiles = (evidenceFilesPayload) => {
  if (!Array.isArray(evidenceFilesPayload)) {
    return [];
  }

  return evidenceFilesPayload
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const fileUrl = normalizeText(item.fileUrl);
      if (!fileUrl) {
        return null;
      }

      const fileName = normalizeText(item.fileName) || fileUrl.split('/').pop() || null;
      return { fileUrl, fileName };
    })
    .filter(Boolean);
};

export const createComplaint = async (req, res) => {
  try {
    const complaintPayload = {
      firstName: normalizeText(req.body.firstName),
      lastName: normalizeText(req.body.lastName),
      emailAddress: normalizeText(req.body.emailAddress || req.body.email),
      phoneNumber: normalizeText(req.body.phoneNumber || req.body.phone),
      countryOfResidence: normalizeText(req.body.countryOfResidence),
      agentNameOrCompany: normalizeText(req.body.agentNameOrCompany),
      aegaReferenceNumber: normalizeText(req.body.aegaReferenceNumber),
      typeOfComplaint: normalizeText(req.body.typeOfComplaint),
      description: normalizeText(req.body.description),
      evidenceFiles: normalizeEvidenceFiles(req.body.evidenceFiles),
      acceptedDeclaration: Boolean(req.body.acceptedDeclaration)
    };

    const requiredFields = [
      'firstName',
      'lastName',
      'emailAddress',
      'phoneNumber',
      'countryOfResidence',
      'agentNameOrCompany',
      'typeOfComplaint',
      'description'
    ].filter((field) => !complaintPayload[field]);

    if (requiredFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${requiredFields.join(', ')}`
      });
    }

    if (!complaintPayload.acceptedDeclaration) {
      return res.status(400).json({ error: 'acceptedDeclaration must be true.' });
    }

    const complaint = new Complaint(complaintPayload);
    await complaint.save();

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaintId: complaint._id,
      status: complaint.status
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getComplaints = async (_req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};