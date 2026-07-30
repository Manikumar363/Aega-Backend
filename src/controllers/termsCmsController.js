import TermsContent from '../models/termsContent.js';

const defaultTermsContent = {
  title: 'Terms of Use',
  lastUpdated: 'July 30, 2026',
  introduction: 'By accessing or using our platform, you agree to comply with and be bound by these Terms of Use.',
  sections: [
    { title: '1. User Obligations', content: 'You must provide accurate credentials and supporting documents during registration.' },
    { title: '2. Prohibited Conduct', content: 'You agree not to bypass verification checks, submit false data, or misuse the CDP training resources.' },
    { title: '3. Termination', content: 'We reserve the right to suspend accounts failing compliance monitoring audits.' }
  ]
};

export const getTermsContent = async (req, res) => {
  try {
    let content = await TermsContent.findOne();
    if (!content) {
      content = new TermsContent(defaultTermsContent);
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching terms content:', error);
    return res.status(500).json({ success: false, message: 'Server error loading content' });
  }
};

export const updateTermsContent = async (req, res) => {
  try {
    let content = await TermsContent.findOne();
    if (!content) {
      content = new TermsContent(defaultTermsContent);
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
    console.error('Error updating terms content:', error);
    return res.status(500).json({ success: false, message: 'Server error updating content' });
  }
};
