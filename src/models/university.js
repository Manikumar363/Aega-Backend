import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  phone: { type: String, default: null, trim: true },
  website: { type: String, default: null, trim: true },
  region: { type: String, default: null, trim: true },
  country: { type: String, default: null, trim: true },
  city: { type: String, default: null, trim: true },
  logo: { type: String, default: null, trim: true },
  accreditation: { type: String, default: null, trim: true },
  coursesOffered: { type: [String], default: [] },
  description: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  reviewNote: { type: String, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('University', universitySchema);
