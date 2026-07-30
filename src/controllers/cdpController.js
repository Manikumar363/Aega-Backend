import CdpCourse from '../models/cdpCourse.js';

const normalizeText = (value) => String(value || '').trim();

const buildCoursePayload = (body, userId) => ({
  courseName: normalizeText(body.courseName),
  type: normalizeText(body.type).toLowerCase(),
  courseFor: normalizeText(body.courseFor).toLowerCase(),
  timeInHr: Number(body.timeInHr),
  modules: Number(body.modules),
  hyperLink: normalizeText(body.hyperLink),
  description: normalizeText(body.description),
  coverPicture: normalizeText(body.coverPicture),
  createdBy: userId
});

const getMissingCourseFields = (payload) => {
  const requiredChecks = [
    ['courseName', payload.courseName],
    ['type', payload.type],
    ['courseFor', payload.courseFor],
    ['timeInHr', payload.timeInHr],
    ['modules', payload.modules],
    ['hyperLink', payload.hyperLink],
    ['description', payload.description],
    ['coverPicture', payload.coverPicture]
  ];

  return requiredChecks
    .filter(([, value]) => !value || Number.isNaN(value))
    .map(([key]) => key);
};

export const createCdpCourse = async (req, res) => {
  try {
    const payload = buildCoursePayload(req.body, req.user.id);
    const missing = getMissingCourseFields(payload);

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!['mandatory', 'optional'].includes(payload.type)) {
      return res.status(400).json({ error: 'type must be mandatory or optional.' });
    }

    if (!['agents', 'universities', 'b2b', 'b2c'].includes(payload.courseFor)) {
      return res.status(400).json({ error: 'courseFor must be agents, universities, b2b, or b2c.' });
    }

    const course = new CdpCourse(payload);
    await course.save();

    return res.status(201).json({
      message: 'CDP course created successfully.',
      course
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCdpCourses = async (req, res) => {
  try {
    const { category, duration, courseFor } = req.query;
    const filterQuery = {};

    if (category) {
      filterQuery.type = normalizeText(category).toLowerCase();
    }

    if (courseFor) {
      filterQuery.courseFor = normalizeText(courseFor).toLowerCase();
    }

    if (duration) {
      const dur = normalizeText(duration).toLowerCase();
      if (dur === 'short') {
        filterQuery.timeInHr = { $lte: 5 };
      } else if (dur === 'medium') {
        filterQuery.timeInHr = { $gt: 5, $lte: 20 };
      } else if (dur === 'long') {
        filterQuery.timeInHr = { $gt: 20 };
      }
    }

    const courses = await CdpCourse.find(filterQuery).sort({ createdAt: -1 });
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCdpCourseById = async (req, res) => {
  try {
    const course = await CdpCourse.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'CDP course not found.' });
    }

    return res.json(course);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCdpCourse = async (req, res) => {
  try {
    const course = await CdpCourse.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'CDP course not found.' });
    }

    const nextPayload = buildCoursePayload(req.body, course.createdBy);
    const missing = getMissingCourseFields(nextPayload);

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!['mandatory', 'optional'].includes(nextPayload.type)) {
      return res.status(400).json({ error: 'type must be mandatory or optional.' });
    }

    if (!['agents', 'universities', 'b2b', 'b2c'].includes(nextPayload.courseFor)) {
      return res.status(400).json({ error: 'courseFor must be agents, universities, b2b, or b2c.' });
    }

    course.courseName = nextPayload.courseName;
    course.type = nextPayload.type;
    course.courseFor = nextPayload.courseFor;
    course.timeInHr = nextPayload.timeInHr;
    course.modules = nextPayload.modules;
    course.hyperLink = nextPayload.hyperLink;
    course.description = nextPayload.description;
    course.coverPicture = nextPayload.coverPicture;

    await course.save();

    return res.json({
      message: 'CDP course updated successfully.',
      course
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteCdpCourse = async (req, res) => {
  try {
    const course = await CdpCourse.findByIdAndDelete(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'CDP course not found.' });
    }

    return res.json({
      message: 'CDP course deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};