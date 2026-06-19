import mongoose from 'mongoose';

const auditAnswerSchema = new mongoose.Schema({
  criterionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  criterion: { type: String, required: true },
  evidence: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: { type: String, enum: ['compliant', 'non-compliant'], required: true },
  comment: { type: String, default: null }
}, { _id: false });

const entityAuditSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['agent', 'company', 'university'], required: true },
  targetId: { type: String, required: true }, // References AgentProfile, Company, or University (stored as String to support both real ObjectIds and mock IDs)
  categoryName: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCategory', required: true },
  answers: { type: [auditAnswerSchema], default: [] },
  complianceScore: { type: Number, required: true }, // Calculated check score
  auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performant lookup of audits by target
entityAuditSchema.index({ targetType: 1, targetId: 1 });
entityAuditSchema.index({ targetType: 1, targetId: 1, categoryId: 1 });

export default mongoose.model('EntityAudit', entityAuditSchema);
