import mongoose from 'mongoose';

const complaintEvidenceSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, default: null, trim: true }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  emailAddress: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  countryOfResidence: { type: String, required: true, trim: true },
  agentNameOrCompany: { type: String, required: true, trim: true },
  aegaReferenceNumber: { type: String, default: null, trim: true },
  typeOfComplaint: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  evidenceFiles: { type: [complaintEvidenceSchema], default: [] },
  acceptedDeclaration: { type: Boolean, required: true },
  status: { type: String, enum: ['submitted', 'in-review', 'resolved', 'rejected'], default: 'submitted' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Complaint', complaintSchema);