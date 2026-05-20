import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counsellorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentProfile', required: true },
  ownerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, required: true, trim: true },
  startDate: { type: String, required: true, trim: true },
  endDate: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  reviewNote: { type: String, default: null, trim: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
