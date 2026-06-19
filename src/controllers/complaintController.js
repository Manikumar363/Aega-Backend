import Complaint from '../models/complaint.js';
import { sendComplaintReplyEmail } from '../utils/mailer.js';

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

export const replyToComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const replyMessage = normalizeText(req.body.replyMessage || req.body.message);
    if (!replyMessage) {
      return res.status(400).json({ error: 'replyMessage is required.' });
    }

    let emailSent = true;
    let emailError = null;

    try {
      await sendComplaintReplyEmail({
        email: complaint.emailAddress,
        fullName: `${complaint.firstName} ${complaint.lastName}`.trim(),
        complaintReference: complaint.aegaReferenceNumber || complaint._id,
        replyMessage
      });
    } catch (error) {
      emailSent = false;
      emailError = error.message;
    }

    complaint.replyMessage = replyMessage;
    complaint.repliedBy = req.user.id;
    complaint.repliedAt = new Date();
    complaint.status = 'resolved';
    await complaint.save();

    return res.status(200).json({
      message: emailSent
        ? 'Complaint replied successfully and email sent.'
        : 'Complaint reply saved, but email could not be sent.',
      complaint,
      email: {
        sent: emailSent,
        error: emailError
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET: Fetch complaints for a specific target (agent, company, university)
export const getTargetComplaints = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'targetType and targetId query parameters are required.' });
    }

    const complaints = await Complaint.find({ targetType, targetId }).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// POST: Admin raise complaint against a target
export const raiseTargetComplaint = async (req, res) => {
  try {
    const { targetType, targetId, typeOfComplaint, description } = req.body;

    if (!targetType || !targetId || !typeOfComplaint || !description) {
      return res.status(400).json({ error: 'targetType, targetId, typeOfComplaint, and description are required.' });
    }

    if (!['agent', 'company', 'university'].includes(targetType.toLowerCase())) {
      return res.status(400).json({ error: 'targetType must be one of: agent, company, university.' });
    }

    const complaint = new Complaint({
      targetType: targetType.toLowerCase(),
      targetId,
      firstName: 'Aega',
      lastName: 'Admin',
      emailAddress: req.user?.email || 'admin@aega.com',
      phoneNumber: 'N/A',
      countryOfResidence: 'N/A',
      agentNameOrCompany: 'Admin Raised',
      typeOfComplaint,
      description,
      acceptedDeclaration: true,
      status: 'submitted'
    });

    await complaint.save();

    return res.status(201).json({
      message: 'Complaint raised successfully by admin.',
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};