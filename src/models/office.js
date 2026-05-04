import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, default: null, trim: true },
  email: { type: String, default: null, trim: true },
  mobileNumber: { type: String, default: null, trim: true },
  imageUrl: { type: String, default: null, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const officeSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: String, required: true, trim: true },
  fullAddress: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  employees: { type: [employeeSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Office', officeSchema);
