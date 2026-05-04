import mongoose from 'mongoose';

const educationEntrySchema = new mongoose.Schema(
  {
    schoolOrCollege: { type: String, default: null, trim: true },
    boardOrUniversity: { type: String, default: null, trim: true },
    streamOrSpecialization: { type: String, default: null, trim: true },
    cgpaOrPercentage: { type: String, default: null, trim: true },
    yearOfPassing: { type: String, default: null, trim: true }
  },
  { _id: false }
);

const employmentEntrySchema = new mongoose.Schema(
  {
    companyName: { type: String, default: null, trim: true },
    role: { type: String, default: null, trim: true },
    emailId: { type: String, default: null, trim: true },
    phoneNumber: { type: String, default: null, trim: true },
    startDate: { type: String, default: null, trim: true },
    endDate: { type: String, default: null, trim: true },
    currentlyWorkingHere: { type: Boolean, default: false }
  },
  { _id: false }
);

const preferredRegionCollegeSchema = new mongoose.Schema(
  {
    region: { type: String, default: null, trim: true },
    country: { type: String, default: null, trim: true },
    collegeName: { type: String, default: null, trim: true }
  },
  { _id: false }
);

const universityPreferenceSchema = new mongoose.Schema(
  {
    universityName: { type: String, required: true, trim: true },
    courseName: { type: String, default: null, trim: true },
    region: { type: String, default: null, trim: true },
    country: { type: String, default: null, trim: true },
    location: { type: String, default: null, trim: true },
    eligibilityStatus: { type: String, default: 'TBD', trim: true },
    applicationStatus: { type: String, default: 'On-Going', trim: true },
    intakeDate: { type: String, default: null, trim: true },
    startDate: { type: String, default: null, trim: true },
    endDate: { type: String, default: null, trim: true },
    tuitionFee: { type: String, default: null, trim: true },
    firstTermFee: { type: String, default: null, trim: true },
    logoUrl: { type: String, default: null, trim: true },
    universityEmail: { type: String, default: null, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  emailId: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  tenthInformation: { type: [educationEntrySchema], default: [] },
  twelfthInformation: { type: [educationEntrySchema], default: [] },
  graduationInformation: { type: [educationEntrySchema], default: [] },
  postGraduationInformation: { type: [educationEntrySchema], default: [] },
  employmentInformation: { type: [employmentEntrySchema], default: [] },
  preferredRegionAndCollege: { type: [preferredRegionCollegeSchema], default: [] },
  universitiesPreferences: { type: [universityPreferenceSchema], default: [] },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Student', studentSchema);