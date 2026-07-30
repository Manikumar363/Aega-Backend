import University from '../models/university.js';
import User from '../models/user.js';

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
      .populate('userId', 'email phone');

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
    const userId = isUniversityAccount ? req.user.id : null;
    const createdBy = req.user.id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    if (isUniversityAccount) {
      // Check if university already exists for this university account
      const existingUniversity = await University.findOne({ userId });
      if (existingUniversity) {
        return res.status(400).json({
          success: false,
          message: 'University profile already exists for this user'
        });
      }
    }

    const university = new University({
      userId,
      createdBy,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      website: website || null,
      region: region || null,
      country: country || null,
      city: city || null,
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
    const userId = req.user.id;

    const university = await University.findOne({ userId })
      .populate('userId', 'email phone');

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
