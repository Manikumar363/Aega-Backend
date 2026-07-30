import mongoose from 'mongoose';

const cdpCourseSchema = new mongoose.Schema({
  courseName: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['mandatory', 'optional'] },
  courseFor: { type: String, required: true, enum: ['agents', 'universities', 'b2b', 'b2c'], default: 'agents' },
  timeInHr: { type: Number, required: true, min: 1 },
  modules: { type: Number, required: true, min: 1 },
  hyperLink: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  coverPicture: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CdpCourse', cdpCourseSchema);