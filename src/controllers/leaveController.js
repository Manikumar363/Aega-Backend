import LeaveRequest from '../models/leaveRequest.js';
import AgentProfile from '../models/agentProfile.js';

const normalizeText = (value) => String(value || '').trim();

const getCounsellorProfile = async (userId) => {
  return AgentProfile.findOne({ userId }).populate('createdBy', 'name email role businessType');
};

export const createLeaveRequest = async (req, res) => {
  try {
    const profile = await getCounsellorProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Counsellor profile not found.' });
    }

    if (!profile.createdBy) {
      return res.status(400).json({ error: 'Parent agent not linked to this counsellor.' });
    }

    const payload = {
      counsellorId: req.user.id,
      counsellorProfileId: profile._id,
      ownerAgentId: profile.createdBy._id || profile.createdBy,
      leaveType: normalizeText(req.body.leaveType),
      startDate: normalizeText(req.body.startDate),
      endDate: normalizeText(req.body.endDate),
      title: normalizeText(req.body.title),
      reason: normalizeText(req.body.reason)
    };

    const requiredFields = ['leaveType', 'startDate', 'endDate', 'title', 'reason'].filter((field) => !payload[field]);
    if (requiredFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${requiredFields.join(', ')}` });
    }

    const leaveRequest = new LeaveRequest(payload);
    await leaveRequest.save();

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leaveRequest
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ counsellorId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('ownerAgentId', 'name email role businessType')
      .lean();

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getTeamLeaveRequests = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin ? {} : { ownerAgentId: req.user.id };

    const leaves = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('counsellorId', 'name email role businessType')
      .populate('ownerAgentId', 'name email role businessType')
      .populate('reviewedBy', 'name email role businessType')
      .lean();

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const resolveManagedLeave = async (leaveId, user) => {
  const leaveRequest = await LeaveRequest.findOne({ _id: leaveId, ownerAgentId: user.id });
  if (!leaveRequest) {
    return { error: { code: 404, message: 'Leave request not found.' } };
  }
  return { leaveRequest };
};

const reviewLeave = async (req, res, status) => {
  try {
    const { leaveRequest, error } = await resolveManagedLeave(req.params.leaveId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request has already been reviewed.' });
    }

    leaveRequest.status = status;
    leaveRequest.reviewNote = normalizeText(req.body.reviewNote) || null;
    leaveRequest.reviewedBy = req.user.id;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.updatedAt = new Date();

    await leaveRequest.save();

    return res.json({
      message: `Leave request ${status} successfully.`,
      leaveRequest
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const acceptLeaveRequest = async (req, res) => {
  return reviewLeave(req, res, 'accepted');
};

export const rejectLeaveRequest = async (req, res) => {
  return reviewLeave(req, res, 'rejected');
};

export const deleteLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leaveRequest = await LeaveRequest.findById(leaveId);

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const isParent = String(leaveRequest.ownerAgentId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isParent && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this leave request.' });
    }

    await LeaveRequest.deleteOne({ _id: leaveId });

    return res.json({ message: 'Leave request deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
