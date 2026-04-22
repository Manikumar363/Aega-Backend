import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

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
      role: user.role
    };

    if (user.role === 'agent') {
      userResponse.businessType = user.businessType || null;
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
