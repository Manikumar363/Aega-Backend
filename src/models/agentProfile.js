import mongoose from 'mongoose';

const authorizationSchema = new mongoose.Schema(
  {
    addAgent: { type: Boolean, default: false },
    editAgent: { type: Boolean, default: false },
    assignUni: { type: Boolean, default: false },
    addOffice: { type: Boolean, default: false },
    editOffice: { type: Boolean, default: false },
    removeOffice: { type: Boolean, default: false },
    assignRegion: { type: Boolean, default: false },
    assignCourse: { type: Boolean, default: false },
    removeAgent: { type: Boolean, default: false }
  },
  { _id: false }
);

const agentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, trim: true },
  firstName: { type: String, trim: true, default: '' },
  lastName: { type: String, trim: true, default: '' },
  emailId: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  office: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  authorization: { type: authorizationSchema, default: () => ({}) },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  complianceScore: { type: Number, default: 100 },
  numberOfAudits: { type: Number, default: 0 },
  activeAlerts: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AgentProfile', agentProfileSchema);