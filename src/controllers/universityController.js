import University from '../models/university.js';

export const listUniversities = async (req, res) => {
  try {
    const universities = await University.find({ status: 'active' })
      .select('_id name email region country city logo coursesOffered')
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
    const userId = req.user.id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if university already exists for this user
    const existingUniversity = await University.findOne({ userId });
    if (existingUniversity) {
      return res.status(400).json({
        success: false,
        message: 'University profile already exists for this user'
      });
    }

    const university = new University({
      userId,
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

    // Only university owner or admin can update
    if (university.userId.toString() !== userId && req.user.role !== 'admin') {
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
