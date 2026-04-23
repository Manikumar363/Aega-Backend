import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    weekly: { type: Number, default: 0, min: 0 },
    monthly: { type: Number, default: 0, min: 0 },
    yearly: { type: Number, default: 0, min: 0 },
    max: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  founderName: { type: String, required: true, trim: true },
  emailId: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  office: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  companyDocument1: { type: String, required: true, trim: true },
  companyDocument2: { type: String, required: true, trim: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performanceMatrix: {
    visaRefusal: { type: scoreSchema, default: () => ({ max: 75 }) },
    enrollment: { type: scoreSchema, default: () => ({ max: 75 }) },
    withdrawnStudent: { type: scoreSchema, default: () => ({ max: 75 }) },
    withdrawnPayment: { type: scoreSchema, default: () => ({ max: 75 }) },
    academicWithdrawn: { type: scoreSchema, default: () => ({ max: 75 }) },
    studentOutputSuccess: { type: scoreSchema, default: () => ({ max: 75 }) }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Company', companySchema);