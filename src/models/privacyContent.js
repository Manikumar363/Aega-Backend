import mongoose from 'mongoose';

const PrivacyContentSchema = new mongoose.Schema({
  title: { type: String, default: 'Privacy Policy' },
  lastUpdated: { type: String, default: 'July 30, 2026' },
  introduction: { type: String, default: 'Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.' },
  sections: [{
    title: { type: String, default: '' },
    content: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('PrivacyContent', PrivacyContentSchema);
