import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.js';
import AgentProfile from '../models/agentProfile.js';
import University from '../models/university.js';
import EntityAudit from '../models/entityAudit.js';
import AuditCategory from '../models/auditCategory.js';
import CourseProgress from '../models/courseProgress.js';

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
  documents: (user.documents || []).map((doc) => ({
    documentName: doc.label,
    fileUrl: doc.path,
    originalName: doc.originalName || null,
    uploadedAt: doc.uploadedAt || null
  })),
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
      universityName,
      companyName,
      email,
      password,
      confirmPassword,
      role,
      businessType
    } = req.body;

    if (!email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'email, password, confirmPassword and role are required.' });
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
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'firstName and lastName are required for agent signup.' });
      }

      normalizedBusinessType = rawBusinessType;
      if (!['b2b', 'b2c'].includes(normalizedBusinessType)) {
        return res.status(400).json({ error: 'For role=agent, businessType must be b2b or b2c.' });
      }
    } else if (rawBusinessType) {
      return res.status(400).json({ error: 'businessType is allowed only when role=agent.' });
    }

    const resolvedUniversityName = normalizeText(universityName || companyName || `${firstName || ''} ${lastName || ''}`).trim();
    const resolvedDisplayName = normalizedRole === 'university'
      ? resolvedUniversityName
      : `${firstName} ${lastName}`.trim();

    if (normalizedRole === 'university' && !resolvedUniversityName) {
      return res.status(400).json({ error: 'universityName is required for university signup.' });
    }

    if (normalizedRole === 'agent' && (!firstName || !lastName)) {
      return res.status(400).json({ error: 'firstName and lastName are required for agent signup.' });
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
      firstName: normalizedRole === 'agent' ? firstName : null,
      lastName: normalizedRole === 'agent' ? lastName : null,
      name: resolvedDisplayName || email,
      email,
      password,
      role: normalizedRole,
      businessType: normalizedBusinessType,
      profileImage: normalizeText(req.body.profileImage) || null,
      documents
    });

    await user.save();

    if (normalizedRole === 'university') {
      const existingUniversity = await University.findOne({ userId: user._id });
      if (!existingUniversity) {
        await University.create({
          userId: user._id,
          createdBy: user._id,
          name: resolvedUniversityName,
          email: user.email,
          status: 'pending'
        });
      }
    } else if (normalizedRole === 'agent') {
      const existingAgentProfile = await AgentProfile.findOne({ userId: user._id });
      if (!existingAgentProfile) {
        await AgentProfile.create({
          userId: user._id,
          firstName: user.firstName || firstName || 'Agent',
          lastName: user.lastName || lastName || 'User',
          emailId: user.email,
          mobileNumber: '+0 000 000 0000',
          designation: user.businessType === 'b2b' ? 'B2B Owner' : 'Agent',
          office: 'HQ',
          country: 'Not Specified',
          createdBy: user._id,
          complianceScore: 100,
          numberOfAudits: 0,
          activeAlerts: 0,
          riskLevel: 'LOW'
        });
      }
    }

    const token = buildAuthToken(user);
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        universityName: normalizedRole === 'university' ? resolvedUniversityName : null,
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

    if (user.role === 'agent' || user.role === 'counsellor') {
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

    if (user.role !== 'agent' && user.role !== 'counsellor') {
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

    if (user.role !== 'agent' && user.role !== 'counsellor') {
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

    if (user.role !== 'agent' && user.role !== 'counsellor') {
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

export const addMyProfileDocument = async (req, res) => {
  try {
    const requestedUserId = normalizeText(req.params.userId);
    if (requestedUserId && requestedUserId !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }

    const documentName = normalizeText(req.body.documentName);
    const fileUrl = normalizeText(req.body.fileUrl);

    if (!documentName || !fileUrl) {
      return res.status(400).json({ error: 'documentName and fileUrl are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== 'agent' && user.role !== 'counsellor') {
      return res.status(403).json({ error: 'Agent profile access only.' });
    }

    const nextDocuments = Array.isArray(user.documents) ? [...user.documents] : [];
    nextDocuments.push({
      label: documentName,
      originalName: fileUrl.split('/').pop() || null,
      mimeType: null,
      size: null,
      path: fileUrl
    });

    user.documents = nextDocuments;
    await user.save();

    const profile = await User.findById(user._id).select('-password');
    return res.status(201).json({
      message: 'Document added successfully.',
      profile: buildAgentProfileResponse(profile)
    });
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

export const getMyComplianceSummary = async (req, res) => {
  try {
    let targetType = null;
    let targetId = null;

    if (req.user.role === 'agent' || req.user.role === 'counsellor') {
      targetType = 'agent';
      const profile = await AgentProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return res.status(404).json({ error: 'Agent profile not found.' });
      }
      targetId = profile._id;
    } else if (req.user.role === 'university') {
      targetType = 'university';
      const university = await University.findOne({ userId: req.user.id });
      if (!university) {
        return res.status(404).json({ error: 'University profile not found.' });
      }
      targetId = university._id;
    } else {
      return res.status(400).json({ error: 'Invalid user role for compliance summary.' });
    }

    let complianceScore = 100;
    let numberOfAudits = 0;
    let activeAlerts = 0;
    let riskLevel = 'LOW';

    if (targetType === 'agent') {
      const profile = await AgentProfile.findById(targetId);
      if (profile) {
        complianceScore = profile.complianceScore ?? 100;
        numberOfAudits = profile.numberOfAudits ?? 0;
        activeAlerts = profile.activeAlerts ?? 0;
        riskLevel = profile.riskLevel ?? 'LOW';
      }
    } else if (targetType === 'university') {
      const university = await University.findById(targetId);
      if (university) {
        complianceScore = university.complianceScore ?? 100;
        numberOfAudits = university.numberOfAudits ?? 0;
        activeAlerts = university.activeAlerts ?? 0;
        riskLevel = university.riskLevel ?? 'LOW';
      }
    }

    // Calculate CDP hours completed by this user
    let completedCdpHours = 0;
    try {
      const completedProgress = await CourseProgress.find({ userId: req.user.id, status: 'completed' })
        .populate('courseId', 'timeInHr');
      completedCdpHours = completedProgress.reduce((sum, item) => sum + (item.courseId?.timeInHr || 0), 0);
    } catch (cdpErr) {
      console.error('Error calculating completed CDP hours:', cdpErr);
    }

    return res.status(200).json({
      success: true,
      data: {
        overallScore: complianceScore,
        numberOfAudits,
        activeIssues: activeAlerts,
        riskLevel,
        completedCdpHours,
        targetCdpHours: 120
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching compliance summary.',
      error: error.message
    });
  }
};

export const getMyComplianceStatus = async (req, res) => {
  try {
    let targetType = null;
    let targetId = null;

    if (req.user.role === 'agent' || req.user.role === 'counsellor') {
      targetType = 'agent';
      const profile = await AgentProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return res.status(404).json({ error: 'Agent profile not found.' });
      }
      targetId = profile._id;
    } else if (req.user.role === 'university') {
      targetType = 'university';
      const university = await University.findOne({ userId: req.user.id });
      if (!university) {
        return res.status(404).json({ error: 'University profile not found.' });
      }
      targetId = university._id;
    } else {
      return res.status(400).json({ error: 'Invalid user role for compliance status.' });
    }

    const categoriesTarget = targetType === 'university' ? 'university' : 'agent';
    const categories = await AuditCategory.find({ target: categoriesTarget }).lean();

    const checks = await EntityAudit.find({ targetType, targetId }).lean();
    const checksByCategory = {};
    checks.forEach(check => {
      checksByCategory[String(check.categoryId)] = check;
    });

    const complianceList = categories.map((cat, index) => {
      const check = checksByCategory[String(cat._id)];
      let status = 'Pending';

      if (check) {
        const hasAlerts = (check.answers || []).some(ans => ans.status === 'non-compliant');
        status = hasAlerts ? 'Non-Compliant' : 'Compliant';
      }

      return {
        id: index + 1,
        categoryId: cat._id,
        name: cat.name,
        status
      };
    });

    return res.status(200).json({
      success: true,
      data: complianceList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching compliance status.',
      error: error.message
    });
  }
};

export const getMyLocationCompliances = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'counsellor') {
      return res.status(400).json({ error: 'Only agents can fetch location-based compliance statistics.' });
    }

    // 1. Fetch all profiles under this B2B/B2C agency (owner + counsellors)
    const profiles = await AgentProfile.find({
      $or: [{ createdBy: req.user.id }, { userId: req.user.id }]
    });

    if (profiles.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    // 2. Fetch all audit categories
    const categories = await AuditCategory.find({ target: 'agent' }).lean();

    // 3. Fetch all audits/checks for these profiles
    const profileIds = profiles.map(p => p._id);
    const audits = await EntityAudit.find({
      targetType: 'agent',
      targetId: { $in: profileIds }
    }).lean();

    // Index audits by profile ID and category ID
    const auditsByProfileAndCat = {};
    audits.forEach(audit => {
      const pId = String(audit.targetId);
      const cId = String(audit.categoryId);
      if (!auditsByProfileAndCat[pId]) {
        auditsByProfileAndCat[pId] = {};
      }
      auditsByProfileAndCat[pId][cId] = audit;
    });

    // 4. Group profiles by office (location name)
    const locationGroups = {};
    profiles.forEach(profile => {
      const loc = profile.office || 'HQ';
      if (!locationGroups[loc]) {
        locationGroups[loc] = [];
      }
      locationGroups[loc].push(profile);
    });

    // 5. Build aggregated stats for each location group
    const locationStats = {};
    Object.entries(locationGroups).forEach(([locName, groupProfiles]) => {
      const count = groupProfiles.length;
      const sumScore = groupProfiles.reduce((sum, p) => sum + (p.complianceScore ?? 100), 0);
      const sumAudits = groupProfiles.reduce((sum, p) => sum + (p.numberOfAudits ?? 0), 0);
      const sumAlerts = groupProfiles.reduce((sum, p) => sum + (p.activeAlerts ?? 0), 0);
      const avgScore = count > 0 ? Math.round(sumScore / count) : 100;

      let riskLevel = 'LOW';
      if (avgScore < 50) riskLevel = 'HIGH';
      else if (avgScore < 85) riskLevel = 'MEDIUM';

      // Aggregate compliance status per category
      const aggregatedIndicators = categories.map((cat, idx) => {
        let hasCheck = false;
        let hasNonCompliant = false;

        groupProfiles.forEach(p => {
          const check = auditsByProfileAndCat[String(p._id)]?.[String(cat._id)];
          if (check) {
            hasCheck = true;
            const hasAlerts = (check.answers || []).some(ans => ans.status === 'non-compliant');
            if (hasAlerts) {
              hasNonCompliant = true;
            }
          }
        });

        let status = 'Pending';
        if (hasCheck) {
          status = hasNonCompliant ? 'Non-Compliant' : 'Compliant';
        }

        return {
          id: idx + 1,
          categoryId: cat._id,
          name: cat.name,
          status
        };
      });

      locationStats[locName] = {
        agentCount: count,
        summary: {
          overallScore: avgScore,
          numberOfAudits: sumAudits,
          activeIssues: sumAlerts,
          riskLevel
        },
        indicators: aggregatedIndicators
      };
    });

    return res.status(200).json({
      success: true,
      data: locationStats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching location compliances.',
      error: error.message
    });
  }
};
