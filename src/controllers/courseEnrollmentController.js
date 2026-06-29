import mongoose from 'mongoose';
import CourseProgress from '../models/courseProgress.js';
import CdpCourse from '../models/cdpCourse.js';
import AgentProfile from '../models/agentProfile.js';
import University from '../models/university.js';
import Company from '../models/company.js';

const normalizeText = (value) => String(value || '').trim();

// Calculate due date based on course duration (1 hour = 1 day)
const calculateDueDate = (startDate, courseTimeInHrs) => {
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + courseTimeInHrs);
  return dueDate;
};

// Check and update status based on due date
const updateCourseStatus = (courseProgress) => {
  if (courseProgress.status === 'completed') {
    return courseProgress.status;
  }

  const today = new Date();
  if (today > courseProgress.dueDate) {
    return 'due';
  }

  return 'on-going';
};

// POST: Enroll in a course
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { notes, startDate } = req.body;
    const userId = req.user.id;

    // Check if course exists
    const course = await CdpCourse.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseProgress.findOne({
      userId,
      courseId
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Use provided startDate or default to today
    let enrollmentStartDate = new Date();
    if (startDate) {
      const providedDate = new Date(startDate);
      if (isNaN(providedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        });
      }
      enrollmentStartDate = providedDate;
    }

    const dueDate = calculateDueDate(enrollmentStartDate, course.timeInHr);

    const courseProgress = new CourseProgress({
      userId,
      courseId,
      startDate: enrollmentStartDate,
      dueDate,
      notes: normalizeText(notes) || null,
      status: 'on-going'
    });

    await courseProgress.save();

    const populatedProgress = await CourseProgress.findById(courseProgress._id)
      .populate('courseId', 'courseName type timeInHr modules description')
      .populate('userId', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      data: populatedProgress
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

// GET: Get all enrolled courses for user with progress
export const getMyEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const courseProgress = await CourseProgress.find({ userId })
      .populate('courseId', 'courseName type timeInHr modules description coverPicture hyperLink')
      .populate('userId', 'name email role')
      .sort({ enrollmentDate: -1 });

    // Update status for each course based on due date
    const updatedCourses = courseProgress.map((course) => {
      const updatedStatus = updateCourseStatus(course);
      if (updatedStatus !== course.status) {
        course.status = updatedStatus;
      }
      return course;
    });

    return res.json({
      success: true,
      data: updatedCourses,
      message: 'Enrolled courses fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
};

// GET: Get specific course progress by ID
export const getCourseProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const userId = req.user.id;

    const courseProgress = await CourseProgress.findOne({
      _id: progressId,
      userId
    })
      .populate('courseId', 'courseName type timeInHr modules description coverPicture')
      .populate('userId', 'name email role');

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: 'Course progress not found'
      });
    }

    // Update status based on due date
    const updatedStatus = updateCourseStatus(courseProgress);
    if (updatedStatus !== courseProgress.status) {
      courseProgress.status = updatedStatus;
      await courseProgress.save();
    }

    return res.json({
      success: true,
      data: courseProgress,
      message: 'Course progress fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching course progress',
      error: error.message
    });
  }
};

// PUT: Update course progress with certificate upload
export const updateCourseProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { certificateUrl, notes } = req.body;
    const userId = req.user.id;

    if (!certificateUrl) {
      return res.status(400).json({
        success: false,
        message: 'Certificate URL is required'
      });
    }

    const courseProgress = await CourseProgress.findOne({
      _id: progressId,
      userId
    });

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: 'Course progress not found'
      });
    }

    courseProgress.certificateUrl = normalizeText(certificateUrl);
    courseProgress.completionDate = new Date();
    courseProgress.status = 'completed';

    if (notes) {
      courseProgress.notes = normalizeText(notes);
    }

    // Calculate progress percentage
    const course = await CdpCourse.findById(courseProgress.courseId);
    if (course) {
      const daysTaken = Math.ceil(
        (courseProgress.completionDate - courseProgress.startDate) / (1000 * 60 * 60 * 24)
      );
      const progressPercent = Math.min(
        100,
        Math.round((daysTaken / course.timeInHr) * 100)
      );
      courseProgress.progress = progressPercent;
    }

    courseProgress.updatedAt = new Date();
    await courseProgress.save();

    const updatedProgress = await CourseProgress.findById(progressId)
      .populate('courseId', 'courseName type timeInHr modules description')
      .populate('userId', 'name email role');

    return res.json({
      success: true,
      message: 'Course completed successfully',
      data: updatedProgress
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating course progress',
      error: error.message
    });
  }
};

// GET: Get course progress statistics (for dashboard)
export const getCourseProgressStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await CourseProgress.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCourses = await CourseProgress.countDocuments({ userId });

    const statsObject = {
      total: totalCourses,
      completed: 0,
      'on-going': 0,
      due: 0
    };

    stats.forEach((stat) => {
      statsObject[stat._id] = stat.count;
    });

    return res.json({
      success: true,
      data: statsObject,
      message: 'Course progress statistics fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// GET: Get enrolled courses for a target user profile (Admin only)
export const getTargetUserEnrolledCourses = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetType and targetId are required query parameters'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetId format. Must be a 24-character hex string.'
      });
    }

    let resolvedUserId = null;

    if (targetType === 'agent') {
      const profile = await AgentProfile.findById(targetId).select('userId');
      if (profile) resolvedUserId = profile.userId;
    } else if (targetType === 'university') {
      const university = await University.findById(targetId).select('userId');
      if (university) resolvedUserId = university.userId;
    } else if (targetType === 'company') {
      const company = await Company.findById(targetId).select('agentId');
      if (company) resolvedUserId = company.agentId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetType. Must be agent, university, or company.'
      });
    }

    if (!resolvedUserId) {
      return res.json({
        success: true,
        data: [],
        message: 'No linked user account found for the target.'
      });
    }

    const courseProgressList = await CourseProgress.find({ userId: resolvedUserId })
      .populate('courseId', 'courseName type timeInHr modules description coverPicture hyperLink')
      .populate('userId', 'name email role')
      .sort({ enrollmentDate: -1 });

    // Update status for each course based on due date
    const updatedCourses = courseProgressList.map((course) => {
      const updatedStatus = updateCourseStatus(course);
      if (updatedStatus !== course.status) {
        course.status = updatedStatus;
      }
      return course;
    });

    return res.json({
      success: true,
      data: updatedCourses,
      message: 'Enrolled courses for target user fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses for target user',
      error: error.message
    });
  }
};
