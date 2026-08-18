import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CdpCourse',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: ['on-going', 'due', 'completed'],
    default: 'on-going'
  },
  certificateUrl: {
    type: String,
    trim: true,
    default: null
  },
  completionDate: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 3,
    min: 0,
    max: 100
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseProgressSchema.index({ userId: 1, status: 1 });

export default mongoose.model('CourseProgress', courseProgressSchema);
