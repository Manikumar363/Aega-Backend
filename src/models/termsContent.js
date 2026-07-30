import mongoose from 'mongoose';

const TermsContentSchema = new mongoose.Schema({
  title: { type: String, default: 'Terms of Use' },
  lastUpdated: { type: String, default: 'July 30, 2026' },
  introduction: { type: String, default: 'By accessing or using our platform, you agree to comply with and be bound by these Terms of Use.' },
  sections: [{
    title: { type: String, default: '' },
    content: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('TermsContent', TermsContentSchema);
