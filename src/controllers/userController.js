import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import AgentProfile from '../models/agentProfile.js';

const normalizeText = (value) => String(value || '').trim();

const buildAgentProfileResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  email: user.email,
  role: user.role,
  businessType: user.businessType || null,
  profileImage: user.profileImage || null,
  phone: user.phone || null,
  dateOfBirth: user.dateOfBirth || null,
  companyName: user.companyName || null,
  buildingNumber: user.buildingNumber || null,
  city: user.city || null,
  postCode: user.postCode || null,
  state: user.state || null,
  streetAddress: user.streetAddress || null,
  streetName: user.streetName || null,
  supportingDocuments: (user.documents || []).map((doc) => ({
    label: doc.label,
    path: doc.path
  })),
  createdAt: user.createdAt
});

const buildAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, businessType: user.businessType || null },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

const getSignupUploadedFiles = (files) => {
  const fileList = Array.isArray(files) ? files : Object.values(files || {}).flat();
  const byFieldName = fileList.reduce((accumulator, file) => {
    const fieldName = String(file.fieldname || '').toLowerCase();
    if (!accumulator[fieldName]) {
      accumulator[fieldName] = file;
    }
    return accumulator;
  }, {});

  return {
    doc1:
      byFieldName.supportingdocument1 ||
      byFieldName.supportingdocument ||
      byFieldName.document1 ||
      byFieldName.doc1 ||
      byFieldName.file ||
      fileList[0] ||
      null,
    doc2:
      byFieldName.supportingdocument2 ||
      byFieldName.document2 ||
      byFieldName.doc2 ||
      fileList[1] ||
      null
  };
};

const buildSignupDocuments = (body, files) => {
  const bodyDoc1 = String(body?.supportingDocument1 || body?.supportingDocument || '').trim();
  const bodyDoc2 = String(body?.supportingDocument2 || body?.supportingDocumentB || '').trim();

  if (bodyDoc1 || bodyDoc2) {
    if (!bodyDoc1 || !bodyDoc2) {
      throw new Error('Both supportingDocument1 and supportingDocument2 are required.');
    }

    return [bodyDoc1, bodyDoc2].map((documentUrl, index) => ({
      label: `supportingDocument${index + 1}`,
      originalName: documentUrl.split('/').pop() || null,
      mimeType: null,
      size: null,
      path: documentUrl
    }));
  }

  const { doc1, doc2 } = getSignupUploadedFiles(files);
  if (!doc1 || !doc2) {
    throw new Error('Both supportingDocument1 and supportingDocument2 are required.');
  }

  return [doc1, doc2].map((file, index) => ({
    label: `supportingDocument${index + 1}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path || file.location || file.url || file.filename || ''
  }));
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const signupUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
      businessType
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'firstName, lastName, email, password, confirmPassword and role are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirmPassword must match.' });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!['agent', 'university'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'role must be either agent or university.' });
    }

    const rawBusinessType = String(businessType || '').trim().toLowerCase();

    let normalizedBusinessType = null;
    if (normalizedRole === 'agent') {
      normalizedBusinessType = rawBusinessType;
      if (!['b2b', 'b2c'].includes(normalizedBusinessType)) {
        return res.status(400).json({ error: 'For role=agent, businessType must be b2b or b2c.' });
      }
    } else if (rawBusinessType) {
      return res.status(400).json({ error: 'businessType is allowed only when role=agent.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists with this email.' });
    }

    let documents;
    try {
      documents = buildSignupDocuments(req.body, req.files);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
      role: normalizedRole,
      businessType: normalizedBusinessType,
      profileImage: normalizeText(req.body.profileImage) || null,
      documents
    });

    await user.save();

    const token = buildAuthToken(user);
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        businessType: user.businessType,
        profileImage: user.profileImage || null,
        supportingDocuments: user.documents.map((doc) => doc.path)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = buildAuthToken(user);

    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || null
    };

    if (user.role === 'agent') {
      userResponse.businessType = user.businessType || null;
      const profile = await AgentProfile.findOne({ userId: user._id });
      userResponse.authorization = profile?.authorization || null;
    }

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(401).json({ error: 'Invalid admin email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid admin email or password.' });

    const token = buildAuthToken(user);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

export const getMyAgentProfile = async (req, res) => {
  try {
    const requestedUserId = normalizeText(req.params.userId);
    if (requestedUserId && requestedUserId !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only access your own profile.' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== 'agent') {
      return res.status(403).json({ error: 'Agent profile access only.' });
    }

    return res.json(buildAgentProfileResponse(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateMyAgentProfile = async (req, res) => {
  try {
    const requestedUserId = normalizeText(req.params.userId);
    if (requestedUserId && requestedUserId !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== 'agent') {
      return res.status(403).json({ error: 'Agent profile access only.' });
    }

    const firstName = normalizeText(req.body.firstName);
    const lastName = normalizeText(req.body.lastName);
    const email = normalizeText(req.body.email).toLowerCase();
    const rawBusinessType = normalizeText(req.body.businessType).toLowerCase();
    const profileImage = normalizeText(req.body.profileImage);
    const phone = normalizeText(req.body.phone || req.body.mobileNumber);
    const dateOfBirth = normalizeText(req.body.dateOfBirth);
    const companyName = normalizeText(req.body.companyName);
    const buildingNumber = normalizeText(req.body.buildingNumber);
    const city = normalizeText(req.body.city);
    const postCode = normalizeText(req.body.postCode);
    const state = normalizeText(req.body.state);
    const streetAddress = normalizeText(req.body.streetAddress);
    const streetName = normalizeText(req.body.streetName);
    const supportingDocument1 = normalizeText(req.body.supportingDocument1);
    const supportingDocument2 = normalizeText(req.body.supportingDocument2);

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ error: 'Another user already exists with this email.' });
      }
      user.email = email;
    }

    if (firstName) {
      user.firstName = firstName;
    }

    if (lastName) {
      user.lastName = lastName;
    }

    if (user.firstName || user.lastName) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }

    if (rawBusinessType) {
      if (!['b2b', 'b2c'].includes(rawBusinessType)) {
        return res.status(400).json({ error: 'businessType must be b2b or b2c.' });
      }
      user.businessType = rawBusinessType;
    }

    if (profileImage) {
      user.profileImage = profileImage;
    }

    if (phone) {
      user.phone = phone;
    }

    if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
    }

    if (companyName) {
      user.companyName = companyName;
    }

    if (buildingNumber) {
      user.buildingNumber = buildingNumber;
    }

    if (city) {
      user.city = city;
    }

    if (postCode) {
      user.postCode = postCode;
    }

    if (state) {
      user.state = state;
    }

    if (streetAddress) {
      user.streetAddress = streetAddress;
    }

    if (streetName) {
      user.streetName = streetName;
    }

    if (supportingDocument1 || supportingDocument2) {
      const existingDocuments = (user.documents || []).reduce((acc, doc) => {
        acc[String(doc.label || '').toLowerCase()] = doc;
        return acc;
      }, {});

      const doc1 = supportingDocument1 || existingDocuments.supportingdocument1?.path || '';
      const doc2 = supportingDocument2 || existingDocuments.supportingdocument2?.path || '';

      user.documents = [doc1, doc2]
        .filter(Boolean)
        .map((documentPath, index) => ({
          label: `supportingDocument${index + 1}`,
          originalName: documentPath.split('/').pop() || null,
          mimeType: null,
          size: null,
          path: documentPath
        }));
    }

    await user.save();

    const profile = await User.findById(user._id).select('-password');
    return res.json({
      message: 'Profile updated successfully.',
      profile: buildAgentProfileResponse(profile)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const currentPassword = normalizeText(req.body.currentPassword);
    const newPassword = normalizeText(req.body.newPassword);
    const confirmPassword = normalizeText(req.body.confirmPassword);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'currentPassword, newPassword and confirmPassword are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'newPassword and confirmPassword must match.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'newPassword must be different from currentPassword.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== 'agent') {
      return res.status(403).json({ error: 'Agent profile access only.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Utility: Create a test user for sign-in
export const createTestUser = async () => {
  const testUser = {
    name: 'Test Sponsor',
    email: 'sponsor@example.com',
    password: 'Test@1234',
    role: 'sponsor'
  };
  try {
    const exists = await User.findOne({ email: testUser.email });
    if (!exists) {
      const user = new User(testUser);
      await user.save();
      console.log('Test user created:', user);
    } else {
      console.log('Test user already exists.');
    }
  } catch (err) {
    console.error('Error creating test user:', err.message);
  }
};

export const createAdminUser = async () => {
  const testAdmin = {
    name: 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@1234',
    role: 'admin'
  };

  try {
    const exists = await User.findOne({ email: testAdmin.email });
    if (!exists) {
      const user = new User(testAdmin);
      await user.save();
      console.log('Admin user created:', user.email);
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  }
};
