import mongoose from 'mongoose';

const universityRequestSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentRole: { type: String, default: 'agent', trim: true },
  agentBusinessType: { type: String, default: null, trim: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  universityName: { type: String, required: true, trim: true },
  universityEmail: { type: String, required: true, trim: true },
  message: { type: String, default: null, trim: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  reviewNote: { type: String, default: null, trim: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('UniversityRequest', universityRequestSchema);
