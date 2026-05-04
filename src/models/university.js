import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('University', universitySchema);
