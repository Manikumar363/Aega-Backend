import Complaint from '../models/complaint.js';
import University from '../models/university.js';
import AgentProfile from '../models/agentProfile.js';
import Company from '../models/company.js';
import { sendComplaintReplyEmail, sendComplaintRaisedEmail } from '../utils/mailer.js';

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
      targetType: req.body.targetType ? normalizeText(req.body.targetType).toLowerCase() : 'agent',
      targetId: req.body.targetId ? normalizeText(req.body.targetId) : null,
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
    const complaints = await Complaint.find()
      .populate('repliedBy', 'firstName lastName email')
      .populate('replies.repliedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
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

    const newReply = {
      replyMessage,
      repliedBy: req.user.id,
      repliedAt: new Date()
    };

    if (!complaint.replies) {
      complaint.replies = [];
    }
    complaint.replies.push(newReply);

    // Keep top-level fields for backward compatibility
    complaint.replyMessage = replyMessage;
    complaint.repliedBy = req.user.id;
    complaint.repliedAt = newReply.repliedAt;
    complaint.status = 'resolved';
    
    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('repliedBy', 'firstName lastName email')
      .populate('replies.repliedBy', 'firstName lastName email');

    return res.status(200).json({
      message: emailSent
        ? 'Complaint replied successfully and email sent.'
        : 'Complaint reply saved, but email could not be sent.',
      complaint: updated,
      email: {
        sent: emailSent,
        error: emailError
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['submitted', 'in-review', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    complaint.status = status;
    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('repliedBy', 'firstName lastName email')
      .populate('replies.repliedBy', 'firstName lastName email');

    return res.json({ success: true, complaint: updated });
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

    // Retrieve target email & name
    let targetEmail = null;
    let targetName = '';

    if (targetType.toLowerCase() === 'university') {
      const university = await University.findById(targetId);
      if (university) {
        targetEmail = university.email;
        targetName = university.name;
      }
    } else if (targetType.toLowerCase() === 'agent') {
      const agent = await AgentProfile.findById(targetId);
      if (agent) {
        targetEmail = agent.emailId;
        targetName = agent.fullName;
      }
    } else if (targetType.toLowerCase() === 'company') {
      const company = await Company.findById(targetId);
      if (company) {
        targetEmail = company.email;
        targetName = company.name;
      }
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

    // Trigger email notification if target email was found
    if (targetEmail) {
      try {
        await sendComplaintRaisedEmail({
          email: targetEmail,
          targetName,
          typeOfComplaint,
          description
        });
      } catch (mailErr) {
        console.error('Failed to notify target of admin raised complaint:', mailErr.message);
      }
    }

    return res.status(201).json({
      message: 'Complaint raised successfully by admin.',
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }
    return res.status(200).json({ success: true, message: 'Complaint deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};