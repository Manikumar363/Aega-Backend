import mongoose from 'mongoose';

const policyItemSchema = new mongoose.Schema({
  key: { type: String, required: true }, // e.g. 'privacy', 'website', 'terms', 'conduct', 'confidentiality', 'gdpr'
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  content: { type: String, required: true } // Full policy text
});

const policyContentSchema = new mongoose.Schema({
  policies: { type: [policyItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('PolicyContent', policyContentSchema);
