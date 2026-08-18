import Complaint from '../models/complaint.js';
import { sendContactInquiryEmail } from '../utils/mailer.js';

export const submitContactInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }

    const referenceNumber = `AEG-${Math.floor(100000 + Math.random() * 900000)}`;

    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts[0] || 'Web';
    const lastName = nameParts.slice(1).join(' ') || 'Visitor';

    // Create a new Complaint record representing the Enquiry (which shows up automatically in Enquiries tab)
    const newEnquiry = new Complaint({
      targetType: 'agent', // Default category
      targetId: null,
      firstName,
      lastName,
      emailAddress: email.trim(),
      phoneNumber: phone ? phone.trim() : 'N/A',
      countryOfResidence: 'N/A',
      agentNameOrCompany: 'Public Web Visitor',
      aegaReferenceNumber: referenceNumber,
      typeOfComplaint: subject ? subject.trim() : 'General Support Inquiry',
      description: message.trim(),
      acceptedDeclaration: true,
      status: 'submitted'
    });

    await newEnquiry.save();

    // Call mailer to notify support mailbox
    try {
      await sendContactInquiryEmail({ name, email, phone, subject, message });
    } catch (mailError) {
      console.error('Failed to deliver support inquiry email:', mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Your inquiry has been submitted successfully.',
      referenceNumber
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
