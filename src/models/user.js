import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'sponsor', 'agent', 'university'], required: true },
  businessType: { type: String, enum: ['b2b', 'b2c', null], default: null },
  documents: [
    {
      label: { type: String, required: true },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      path: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  resetOtp: { type: String, default: null },
  resetOtpExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model('User', userSchema);
