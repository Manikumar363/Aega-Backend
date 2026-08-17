import mongoose from 'mongoose';
import University from '../models/university.js';
import User from '../models/user.js';
import Student from '../models/student.js';
import AuditCategory from '../models/auditCategory.js';
import EntityAudit from '../models/entityAudit.js';
import CdpCourse from '../models/cdpCourse.js';
import CourseProgress from '../models/courseProgress.js';
import AgentProfile from '../models/agentProfile.js';
import UniversityRequest from '../models/universityRequest.js';
import Company from '../models/company.js';
import {
  sendUniversityCredentialsEmail,
  sendUniversityAcceptEmail,
  sendUniversityRejectEmail
} from '../utils/mailer.js';

export const listUniversities = async (req, res) => {
  try {
    // Return all universities registered in platform (self-registered or agent-created)
    const universities = await University.find({ $or: [{ userId: { $ne: null } }, { createdBy: { $ne: null } }] })
      .select('_id name email region country city logo coursesOffered status complianceScore numberOfAudits activeAlerts riskLevel')
      .lean();

    return res.status(200).json({
      success: true,
      data: universities,
      message: 'Universities fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching universities',
      error: error.message
    });
  }
};

export const listManagedUniversities = async (req, res) => {
  try {
    const universities = await University.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'email phone role name')
      .populate('createdBy', 'email phone role name')
      .lean();

    return res.status(200).json({
      success: true,
      data: universities,
      message: 'Universities fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching universities',
      error: error.message
    });
  }
};

export const getUniversityById = async (req, res) => {
  try {
    const { universityId } = req.params;

    const university = await University.findById(universityId)
      .populate('userId', 'email phone name firstName lastName documents profileImage');

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: university,
      message: 'University details fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching university',
      error: error.message
    });
  }
};

export const createUniversity = async (req, res) => {
  try {
    const { name, email, phone, website, region, country, city, logo, accreditation, coursesOffered, description } = req.body;
    const isUniversityAccount = req.user?.role === 'university';
    const createdBy = req.user.id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check for duplicate email in User & University collections
    const existingUni = await University.findOne({ email: cleanEmail });
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUni || existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Company already exist with this emailid',
        error: 'Company already exist with this emailid'
      });
    }

    let userId = isUniversityAccount ? req.user.id : null;

    // If created by agent or admin, create linked User account
    if (!userId) {
      const tempPassword = `UniPass@${Math.floor(1000 + Math.random() * 9000)}`;
      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        password: tempPassword,
        role: 'university',
        profilePic: logo || null
      });
      await newUser.save();
      userId = newUser._id;

      // Notify the university with login credentials immediately
      try {
        await sendUniversityCredentialsEmail({
          email: cleanEmail,
          fullName: name.trim(),
          password: tempPassword
        });
      } catch (mailErr) {
        console.error('Failed to send university credentials email:', mailErr);
      }
    }

    const university = new University({
      userId,
      createdBy,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      website: website ? website.trim() : null,
      region: region ? region.trim() : null,
      country: country ? country.trim() : null,
      city: city ? city.trim() : null,
      logo: logo || null,
      accreditation: accreditation || null,
      coursesOffered: coursesOffered || [],
      description: description || null
    });

    await university.save();

    return res.status(201).json({
      success: true,
      data: university,
      message: 'University profile created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Company already exist with this emailid',
        error: 'Company already exist with this emailid'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating university profile',
      error: error.message
    });
  }
};

export const deleteUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const university = await University.findById(universityId);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isOwner = String(university.userId || '') === String(userId) || String(university.createdBy || '') === String(userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this university'
      });
    }

    if (university.userId) {
      await User.deleteOne({ _id: university.userId });
    }

    await University.deleteOne({ _id: university._id });

    return res.status(200).json({
      success: true,
      message: 'University deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting university',
      error: error.message
    });
  }
};

export const updateUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const userId = req.user.id;

    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    // Only university owner, creator, or admin can update
    const isOwner = String(university.userId || '') === String(userId) || String(university.createdBy || '') === String(userId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this university'
      });
    }

    // Update allowed fields
    const { name, phone, website, region, country, city, logo, accreditation, coursesOffered, description, status } = req.body;

    if (name) university.name = name.trim();
    if (phone) university.phone = phone.trim();
    if (website) university.website = website.trim();
    if (region) university.region = region.trim();
    if (country) university.country = country.trim();
    if (city) university.city = city.trim();
    if (logo) university.logo = logo.trim();
    if (accreditation) university.accreditation = accreditation.trim();
    if (coursesOffered) university.coursesOffered = coursesOffered;
    if (description) university.description = description.trim();
    if (status && req.user.role === 'admin') university.status = status; // Only admin can change status

    if (university.userId) {
      const user = await User.findById(university.userId);
      if (user) {
        if (name) {
          user.name = name.trim();
          const parts = name.trim().split(' ');
          user.firstName = parts[0] || '';
          user.lastName = parts.slice(1).join(' ') || '';
        }
        if (phone) {
          user.phone = phone.trim();
        }
        if (logo) {
          user.profileImage = logo.trim();
        }
        await user.save();
      }
    }

    university.updatedAt = new Date();
    await university.save();

    return res.status(200).json({
      success: true,
      data: university,
      message: 'University profile updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating university',
      error: error.message
    });
  }
};

export const getMyUniversity = async (req, res) => {
  try {
    const university = await University.findOne({ userId })
      .populate('userId', 'email phone name firstName lastName documents profileImage');

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: university,
      message: 'University profile fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching university profile',
      error: error.message
    });
  }
};

// Admin: list all universities (optionally filter by status)
export const adminListUniversities = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const universities = await University.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'email phone name')
      .populate('createdBy', 'email phone name')
      .lean();

    const total = await University.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: universities,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching universities', error: error.message });
  }
};

// Admin: get university by id (detailed)
export const adminGetUniversityById = async (req, res) => {
  try {
    const { universityId } = req.params;
    const university = await University.findById(universityId)
      .populate('userId', 'email phone name')
      .populate('createdBy', 'email phone name')
      .populate('reviewedBy', 'email name');

    if (!university) return res.status(404).json({ success: false, message: 'University not found' });

    return res.status(200).json({ success: true, data: university });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching university', error: error.message });
  }
};

// Admin: accept university (set status active)
export const adminAcceptUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const { reviewNote } = req.body;

    const university = await University.findById(universityId);
    if (!university) return res.status(404).json({ success: false, message: 'University not found' });

    university.status = 'active';
    university.reviewNote = reviewNote || null;
    university.reviewedBy = req.user.id;
    university.reviewedAt = new Date();
    university.updatedAt = new Date();

    await university.save();

    // Notify user of account acceptance with notes via email
    try {
      await sendUniversityAcceptEmail({
        email: university.email,
        name: university.name,
        notes: reviewNote
      });
    } catch (mailErr) {
      console.error('Failed to send university acceptance email:', mailErr);
    }

    return res.status(200).json({ success: true, message: 'University accepted', data: university });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error accepting university', error: error.message });
  }
};

// Admin: reject university (set status inactive)
export const adminRejectUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const { reviewNote } = req.body;

    const university = await University.findById(universityId);
    if (!university) return res.status(404).json({ success: false, message: 'University not found' });

    university.status = 'inactive';
    university.reviewNote = reviewNote || null;
    university.reviewedBy = req.user.id;
    university.reviewedAt = new Date();
    university.updatedAt = new Date();

    await university.save();

    // Notify user of account rejection with reason/notes via email
    try {
      await sendUniversityRejectEmail({
        email: university.email,
        name: university.name,
        reason: reviewNote || 'Does not meet requirements',
        notes: reviewNote
      });
    } catch (mailErr) {
      console.error('Failed to send university rejection email:', mailErr);
    }

    return res.status(200).json({ success: true, message: 'University rejected', data: university });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error rejecting university', error: error.message });
  }
};

// Admin: update basic university details (not name/email)
export const adminUpdateUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const university = await University.findById(universityId);
    if (!university) return res.status(404).json({ success: false, message: 'University not found' });

    const allowed = ['phone', 'website', 'region', 'country', 'city', 'logo', 'accreditation', 'coursesOffered', 'description', 'status', 'name', 'email'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        university[field] = req.body[field];
      }
    });

    if (university.userId) {
      const user = await User.findById(university.userId);
      if (user) {
        if (req.body.name) {
          user.name = req.body.name;
          const parts = req.body.name.split(' ');
          user.firstName = parts[0] || '';
          user.lastName = parts.slice(1).join(' ') || '';
        }
        if (req.body.email) {
          user.email = req.body.email;
        }
        if (req.body.phone) {
          user.phone = req.body.phone;
        }
        await user.save();
      }
    }

    university.updatedAt = new Date();
    await university.save();

    return res.status(200).json({ success: true, message: 'University updated', data: university });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating university', error: error.message });
  }
};

export const getUniversityDashboardStats = async (req, res) => {
  try {
    const university = await University.findOne({ userId: req.user.id });
    if (!university) {
      return res.status(404).json({ success: false, message: 'University profile not found' });
    }

    const uniId = university._id;
    const uniName = university.name;

    // 1. Compliance Details
    const complianceScore = university.complianceScore ?? 100;
    const numberOfAudits = university.numberOfAudits ?? 0;
    const activeIssues = university.activeAlerts ?? 0;
    const riskLevel = university.riskLevel ?? 'LOW';

    // 2. CDP Hours
    let completedCdpHours = 0;
    try {
      const completedProgress = await CourseProgress.find({ userId: req.user.id, status: 'completed' })
        .populate('courseId', 'timeInHr');
      completedCdpHours = completedProgress.reduce((sum, item) => sum + (item.courseId?.timeInHr || 0), 0);
    } catch (cdpErr) {
      console.error('Error calculating completed CDP hours:', cdpErr);
    }

    let targetCdpHours = 120;
    try {
      const courses = await CdpCourse.find().select('timeInHr');
      targetCdpHours = courses.reduce((sum, c) => sum + (Number(c.timeInHr) || 0), 0) || 120;
    } catch (err) {
      console.error('Error calculating target CDP hours:', err);
    }

    // 3. Compliances Distribution based on real categories
    const categories = await AuditCategory.find({ target: 'university' }).lean();
    const checks = await EntityAudit.find({ targetType: 'university', targetId: uniId }).lean();
    const checksByCategory = {};
    checks.forEach(check => {
      checksByCategory[String(check.categoryId)] = check;
    });

    const colorMap = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'];
    const complianceDistribution = categories.map((cat, index) => {
      const check = checksByCategory[String(cat._id)];
      let score = 0;
      if (check) {
        const hasAlerts = (check.answers || []).some(ans => ans.status === 'non-compliant');
        score = hasAlerts ? 0 : 100;
      }
      return {
        name: cat.name,
        score,
        color: colorMap[index % colorMap.length]
      };
    });

    if (complianceDistribution.length === 0) {
      complianceDistribution.push(
        { name: 'Agent Compliance', score: 0, color: '#10B981' },
        { name: 'University Compliance', score: 0, color: '#F59E0B' },
        { name: 'UKVI Compliance', score: 0, color: '#3B82F6' },
        { name: 'Rules & Regulations', score: 0, color: '#8B5CF6' }
      );
    }

    // 4. Revenue & Tuition Fees Distribution
    const students = await Student.find({
      'universitiesPreferences.universityName': { $regex: new RegExp(`^${uniName}$`, 'i') }
    }).lean();

    let totalFees = 0;
    let enrolledFees = 0;
    let enrolledCount = 0;

    students.forEach(student => {
      const prefs = student.universitiesPreferences || [];
      prefs.forEach(pref => {
        if (String(pref.universityName).trim().toLowerCase() === uniName.trim().toLowerCase()) {
          const feeStr = String(pref.tuitionFee || '').replace(/[^0-9.]/g, '');
          const feeVal = Number(feeStr) || 0;
          totalFees += feeVal;
          if (['enrolled', 'accepted'].includes(String(pref.applicationStatus).trim().toLowerCase())) {
            enrolledFees += feeVal;
            enrolledCount++;
          }
        }
      });
    });

    const revenueDistribution = [
      { label: 'Total Potential Tuition', value: `£${totalFees.toLocaleString()} GBP`, progress: 100, color: '#10B981' },
      { label: 'Enrolled Tuition Revenue', value: `£${enrolledFees.toLocaleString()} GBP`, progress: totalFees > 0 ? Math.round((enrolledFees / totalFees) * 100) : 0, color: '#3B82F6' },
      { label: 'Active Students Recruited', value: `${students.length} Students`, progress: students.length > 0 ? 100 : 0, color: '#F59E0B' },
      { label: 'Enrolled Student Count', value: `${enrolledCount} Enrolled`, progress: students.length > 0 ? Math.round((enrolledCount / students.length) * 100) : 0, color: '#8B5CF6' }
    ];

    return res.status(200).json({
      success: true,
      data: {
        userName: uniName,
        overallScore: numberOfAudits > 0 ? complianceScore : null,
        numberOfAudits,
        activeIssues,
        riskLevel: numberOfAudits > 0 ? riskLevel : 'N/A',
        completedCdpHours,
        targetCdpHours,
        complianceDistribution,
        revenueDistribution
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching university dashboard stats',
      error: error.message
    });
  }
};

export const getUniversityAgents = async (req, res) => {
  try {
    const university = await University.findOne({ userId: req.user.id });
    if (!university) {
      return res.status(404).json({ success: false, message: 'University profile not found' });
    }

    // Find all UniversityRequest documents for this university (regardless of status, so they see pending request or accepted)
    const requests = await UniversityRequest.find({ universityId: university._id })
      .populate('agentId', 'name email role businessType phone createdAt')
      .lean();

    const agentIds = requests.map(r => r.agentId?._id || r.agentId).filter(Boolean);
    const agentProfiles = await AgentProfile.find({ userId: { $in: agentIds } })
      .select('userId complianceScore numberOfAudits activeAlerts riskLevel mobileNumber designation')
      .lean();

    const profileMap = new Map(agentProfiles.map(p => [String(p.userId), p]));

    const list = requests.map(r => {
      const agentIdStr = String(r.agentId?._id || r.agentId);
      const profile = profileMap.get(agentIdStr);
      return {
        _id: r._id,
        status: r.status,
        agentId: r.agentId,
        agentRole: r.agentId?.role || 'agent',
        agentBusinessType: r.agentId?.businessType || 'b2b',
        agentProfile: profile ? {
          id: profile._id,
          complianceScore: profile.complianceScore ?? 100,
          numberOfAudits: profile.numberOfAudits ?? 0,
          activeAlerts: profile.activeAlerts ?? 0,
          riskLevel: profile.riskLevel || 'LOW',
          mobileNumber: profile.mobileNumber || null,
          designation: profile.designation || null
        } : null
      };
    });

    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching agents', error: error.message });
  }
};

export const addUniversityAgent = async (req, res) => {
  try {
    const university = await University.findOne({ userId: req.user.id });
    if (!university) {
      return res.status(404).json({ success: false, message: 'University profile not found' });
    }

    const { name, email, phone, businessType } = req.body;

    if (!name || !email || !phone || !businessType) {
      return res.status(400).json({ success: false, message: 'Please fill in all mandatory fields.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Duplicate email check
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Agent already exist with this emailid' });
    }

    const tempPassword = `AgentPass@${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: tempPassword,
      role: 'agent',
      businessType: businessType === 'b2b' ? 'b2b' : 'b2c',
      phone: phone.trim()
    });
    await newUser.save();

    const newProfile = new AgentProfile({
      userId: newUser._id,
      fullName: name.trim(),
      emailId: cleanEmail,
      mobileNumber: phone.trim(),
      designation: businessType === 'b2b' ? 'B2B Owner' : 'Agent',
      office: 'HQ',
      country: 'United Kingdom',
      complianceScore: 100,
      numberOfAudits: 0,
      activeAlerts: 0,
      riskLevel: 'LOW',
      createdBy: req.user.id
    });
    await newProfile.save();

    const request = new UniversityRequest({
      agentId: newUser._id,
      universityId: university._id,
      status: 'accepted',
      message: 'Agent created directly by university'
    });
    await request.save();

    // Send credentials email
    try {
      const mailer = await import('../utils/mailer.js');
      await mailer.sendAgentCredentialsEmail({
        email: cleanEmail,
        fullName: name.trim(),
        password: tempPassword
      });
    } catch (mailErr) {
      console.error('Failed to send agent credentials email:', mailErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Agent created successfully and linked to university.',
      data: {
        _id: request._id,
        status: request.status,
        agentId: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          businessType: newUser.businessType
        },
        agentProfile: newProfile
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error adding agent', error: error.message });
  }
};

export const deleteUniversityAgent = async (req, res) => {
  try {
    const university = await University.findOne({ userId: req.user.id });
    if (!university) {
      return res.status(404).json({ success: false, message: 'University profile not found' });
    }

    const { agentId } = req.params;

    const request = await UniversityRequest.findOne({
      agentId,
      universityId: university._id
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Agent not linked to this university' });
    }

    await Promise.all([
      User.deleteOne({ _id: agentId }),
      AgentProfile.deleteOne({ userId: agentId }),
      UniversityRequest.deleteMany({ agentId }),
      Company.deleteMany({ agentId })
    ]);

    return res.status(200).json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting agent', error: error.message });
  }
};
