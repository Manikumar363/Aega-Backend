import mongoose from 'mongoose';

const auditCriterionSchema = new mongoose.Schema({
  criterion: { type: String, required: true, trim: true },
  evidence: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low', required: true }
}, { _id: true });

const auditCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  target: { type: String, enum: ['agent', 'university'], required: true },
  criteria: { type: [auditCriterionSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('AuditCategory', auditCategorySchema);
