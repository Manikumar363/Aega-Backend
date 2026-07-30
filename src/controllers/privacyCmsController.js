import PrivacyContent from '../models/privacyContent.js';

const defaultPrivacyContent = {
  title: 'Privacy Policy',
  lastUpdated: 'July 30, 2026',
  introduction: 'Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.',
  sections: [
    { title: '1. Information We Collect', content: 'We collect information you provide directly to us when creating an account, submitting documents, or contacting support.' },
    { title: '2. How We Use Information', content: 'We use the collected information to verify agency/university profiles, manage compliance, and coordinate training.' },
    { title: '3. Data Security', content: 'We implement high-standard technical and organizational measures to safeguard your private credentials.' }
  ]
};

export const getPrivacyContent = async (req, res) => {
  try {
    let content = await PrivacyContent.findOne();
    if (!content) {
      content = new PrivacyContent(defaultPrivacyContent);
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching privacy content:', error);
    return res.status(500).json({ success: false, message: 'Server error loading content' });
  }
};

export const updatePrivacyContent = async (req, res) => {
  try {
    let content = await PrivacyContent.findOne();
    if (!content) {
      content = new PrivacyContent(defaultPrivacyContent);
    }

    const fields = ['title', 'lastUpdated', 'introduction', 'sections'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        content[field] = req.body[field];
      }
    });

    await content.save();
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error updating privacy content:', error);
    return res.status(500).json({ success: false, message: 'Server error updating content' });
  }
};
