import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendOtpEmail = async (email, otp, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Use the OTP below to proceed:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error.message);
    return false;
  }
};

export const sendAgentCredentialsEmail = async ({ email, fullName, password }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `${appName} Agent Account Credentials`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to ${appName}</h2>
        <p>Hi ${fullName},</p>
        <p>Your agent account has been created successfully.</p>
        <div style="background-color: #f0f0f0; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p>Please login and change your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendComplaintReplyEmail = async ({ email, fullName, complaintReference, replyMessage }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `${appName} Complaint Reply${complaintReference ? ` - ${complaintReference}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Complaint Reply from ${appName}</h2>
        <p>Hi ${fullName},</p>
        <p>We have replied to your complaint${complaintReference ? ` (${complaintReference})` : ''}.</p>
        <div style="background-color: #f7f7f7; padding: 16px; border-radius: 6px; margin: 16px 0; white-space: pre-wrap;">
          ${replyMessage}
        </div>
        <p>If you have further concerns, please reply to this email or contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendUniversityCredentialsEmail = async ({ email, fullName, password }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `${appName} University Account Credentials`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to ${appName}</h2>
        <p>Hi ${fullName},</p>
        <p>Your university account has been created successfully.</p>
        <div style="background-color: #f0f0f0; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p>Please login and change your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendUniversityAcceptEmail = async ({ email, name, notes }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `${appName} University Account Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Congratulations! Account Approved</h2>
        <p>Hi ${name},</p>
        <p>Your university account has been accepted by the admin.</p>
        ${notes ? `<div style="background-color: #f7f7f7; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <strong>Admin Notes:</strong><br/>
          ${notes}
        </div>` : ''}
        <p>You can now log in to the AEGA platform using your registered credentials.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendUniversityRejectEmail = async ({ email, name, reason, notes }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `${appName} University Account Status`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Account Registration Update</h2>
        <p>Hi ${name},</p>
        <p>Your university account registration was reviewed and is currently not accepted.</p>
        <div style="background-color: #f7f7f7; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <strong>Reason:</strong> ${reason || 'Does not meet requirements'}<br/>
          ${notes ? `<strong>Notes:</strong> ${notes}` : ''}
        </div>
        <p>Please contact our support team if you believe this is an error or need further clarification.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendComplaintRaisedEmail = async ({ email, targetName, typeOfComplaint, description }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `[${appName}] Notification: New Complaint Registered`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">Notice of Complaint</h2>
        <p>Dear ${targetName || 'Member'},</p>
        <p>We are writing to notify you that a formal complaint has been registered on the ${appName} platform regarding your profile/services.</p>
        <div style="background-color: #fcf8e3; border: 1px solid #faebcc; padding: 16px; border-radius: 6px; margin: 16px 0; color: #8a6d3b;">
          <p style="margin: 4px 0;"><strong>Type of Complaint:</strong> ${typeOfComplaint}</p>
          <p style="margin: 4px 0;"><strong>Description:</strong></p>
          <p style="margin: 4px 0; font-style: italic; white-space: pre-wrap;">"${description}"</p>
        </div>
        <p>The AEGA compliance department is currently reviewing this matter. If you would like to submit additional information, clarification, or evidence in response to this complaint, please log in to your portal or contact support.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated administrative notification. Please do not reply directly to this email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendContactInquiryEmail = async ({ name, email, phone, subject, message }) => {
  const appName = process.env.APP_NAME || 'AEGA';
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: supportEmail,
    replyTo: email,
    subject: `[${appName} Support Inquiry] ${subject || 'New Contact Request'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #F58A07; border-bottom: 2px solid #F58A07; padding-bottom: 10px; margin-top: 0;">New Support Inquiry</h2>
        <p>You have received a new contact submission from the public marketing site:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px; border-bottom: 1px solid #f4f4f4;">Name:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f4;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f4f4f4;">Email:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f4;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f4f4f4;">Phone:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f4;">${phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f4f4f4;">Subject:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f4;">${subject || 'N/A'}</td>
          </tr>
        </table>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #F58A07; margin-top: 20px;">
          <strong style="display: block; margin-bottom: 10px; color: #555;">Message:</strong>
          <p style="margin: 0; white-space: pre-wrap; color: #333; line-height: 1.6;">${message}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 11px; text-align: center; margin-bottom: 0;">This email was generated automatically by the ${appName} Contact Form.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};
