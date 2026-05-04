import Student from '../models/student.js';

const normalizeText = (value) => String(value || '').trim();

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeEducationArray = (entries) =>
  normalizeArray(entries).map((entry) => ({
    schoolOrCollege: normalizeText(entry?.schoolOrCollege || entry?.schoolName),
    boardOrUniversity: normalizeText(entry?.boardOrUniversity || entry?.boardName),
    streamOrSpecialization: normalizeText(entry?.streamOrSpecialization || entry?.stream),
    cgpaOrPercentage: normalizeText(entry?.cgpaOrPercentage || entry?.percentage),
    yearOfPassing: normalizeText(entry?.yearOfPassing)
  }));

const normalizeEmploymentArray = (entries) =>
  normalizeArray(entries).map((entry) => ({
    companyName: normalizeText(entry?.companyName),
    role: normalizeText(entry?.role),
    emailId: normalizeText(entry?.emailId || entry?.email),
    phoneNumber: normalizeText(entry?.phoneNumber || entry?.mobileNumber),
    startDate: normalizeText(entry?.startDate),
    endDate: normalizeText(entry?.endDate),
    currentlyWorkingHere: Boolean(entry?.currentlyWorkingHere)
  }));

const normalizePreferredRegionArray = (entries) =>
  normalizeArray(entries).map((entry) => ({
    region: normalizeText(entry?.region),
    country: normalizeText(entry?.country),
    collegeName: normalizeText(entry?.collegeName)
  }));

const normalizePreferenceObject = (entry) => ({
  universityName: normalizeText(entry?.universityName),
  courseName: normalizeText(entry?.courseName),
  region: normalizeText(entry?.region),
  country: normalizeText(entry?.country),
  location: normalizeText(entry?.location),
  eligibilityStatus: normalizeText(entry?.eligibilityStatus) || 'TBD',
  applicationStatus: normalizeText(entry?.applicationStatus) || 'On-Going',
  intakeDate: normalizeText(entry?.intakeDate),
  startDate: normalizeText(entry?.startDate),
  endDate: normalizeText(entry?.endDate),
  tuitionFee: normalizeText(entry?.tuitionFee),
  firstTermFee: normalizeText(entry?.firstTermFee),
  logoUrl: normalizeText(entry?.logoUrl),
  universityEmail: normalizeText(entry?.universityEmail)
});

const getStudentByAccess = async (studentId, user) => {
  const student = await Student.findById(studentId)
    .populate('agentId', 'firstName lastName email role businessType');

  if (!student) {
    return { error: { code: 404, message: 'Student not found.' } };
  }

  const isAdmin = user?.role === 'admin';
  const isOwnerAgent = String(student.agentId?._id || student.agentId) === String(user.id);
  if (!isAdmin && !isOwnerAgent) {
    return { error: { code: 403, message: 'You do not have access to this student.' } };
  }

  return { student };
};

export const reorderPreferences = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    // Support two body shapes:
    // 1) Full reorder: { orderedPreferenceIds: ["id1","id2",...] }
    // 2) Single-move: { id: "prefId", from: 3, to: 1 } (positions are 1-based)

    const orderedIds = Array.isArray(req.body.orderedPreferenceIds) ? req.body.orderedPreferenceIds : null;
    if (orderedIds) {
      if (orderedIds.length === 0) {
        return res.status(400).json({ error: 'orderedPreferenceIds (array) is required.' });
      }

      const existingIds = student.universitiesPreferences.map((p) => String(p._id));
      if (orderedIds.length !== existingIds.length) {
        return res.status(400).json({ error: 'orderedPreferenceIds length must match existing preferences length.' });
      }

      // Ensure all provided ids exist on the student
      const missing = orderedIds.filter((id) => !existingIds.includes(String(id)));
      if (missing.length > 0) {
        return res.status(400).json({ error: `Invalid preference ids: ${missing.join(', ')}` });
      }

      // Reorder by mapping ids to existing objects
      const prefsById = {};
      student.universitiesPreferences.forEach((p) => {
        prefsById[String(p._id)] = p;
      });

      const newOrder = orderedIds.map((id) => {
        const pref = prefsById[String(id)];
        const obj = pref.toObject ? pref.toObject() : pref;
        obj.updatedAt = new Date();
        return obj;
      });

      student.universitiesPreferences = newOrder;
    } else if (req.body.id && typeof req.body.from === 'number' && typeof req.body.to === 'number') {
      // Single-move operation
      const moveId = String(req.body.id);
      const existingIds = student.universitiesPreferences.map((p) => String(p._id));

      const currentIndex = existingIds.indexOf(moveId);
      if (currentIndex === -1) {
        return res.status(400).json({ error: 'Provided preference id does not belong to this student.' });
      }

      // Interpret provided positions as 1-based (example: from=3, to=1)
      const toIndex = Number(req.body.to) - 1;
      if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= existingIds.length) {
        return res.status(400).json({ error: 'Invalid "to" position. Provide a 1-based index within range.' });
      }

      // Perform move
      const prefs = student.universitiesPreferences.slice();
      const [moved] = prefs.splice(currentIndex, 1);
      prefs.splice(toIndex, 0, moved);

      // Refresh updatedAt for moved item
      if (prefs[toIndex]) {
        const obj = prefs[toIndex].toObject ? prefs[toIndex].toObject() : prefs[toIndex];
        obj.updatedAt = new Date();
        prefs[toIndex] = obj;
      }

      student.universitiesPreferences = prefs;
    } else {
      return res.status(400).json({ error: 'Invalid body. Provide either orderedPreferenceIds array or { id, from, to } object.' });
    }
    await student.save();

    return res.json({ message: 'Preferences reordered successfully.', preferences: student.universitiesPreferences });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
export const createStudent = async (req, res) => {
  try {
    const payload = {
      firstName: normalizeText(req.body.firstName),
      lastName: normalizeText(req.body.lastName),
      emailId: normalizeText(req.body.emailId || req.body.email),
      mobileNumber: normalizeText(req.body.mobileNumber || req.body.phoneNumber),
      tenthInformation: normalizeEducationArray(req.body.tenthInformation),
      twelfthInformation: normalizeEducationArray(req.body.twelfthInformation),
      graduationInformation: normalizeEducationArray(req.body.graduationInformation),
      postGraduationInformation: normalizeEducationArray(req.body.postGraduationInformation),
      employmentInformation: normalizeEmploymentArray(req.body.employmentInformation),
      preferredRegionAndCollege: normalizePreferredRegionArray(req.body.preferredRegionAndCollege),
      agentId: req.user.id
    };

    const requiredFields = ['firstName', 'lastName', 'emailId', 'mobileNumber'].filter((field) => !payload[field]);
    if (requiredFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${requiredFields.join(', ')}` });
    }

    const student = new Student(payload);
    await student.save();

    return res.status(201).json({
      message: 'Student created successfully.',
      student
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStudents = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin ? {} : { agentId: req.user.id };

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .populate('agentId', 'firstName lastName email role businessType');

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    return res.json(student);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    const incomingEmail = normalizeText(req.body.emailId || req.body.email).toLowerCase();
    if (incomingEmail && incomingEmail !== normalizeText(student.emailId).toLowerCase()) {
      return res.status(400).json({ error: 'emailId cannot be changed once student is created.' });
    }

    const firstName = normalizeText(req.body.firstName);
    const lastName = normalizeText(req.body.lastName);
    const mobileNumber = normalizeText(req.body.mobileNumber || req.body.phoneNumber);

    if (firstName) {
      student.firstName = firstName;
    }

    if (lastName) {
      student.lastName = lastName;
    }

    if (mobileNumber) {
      student.mobileNumber = mobileNumber;
    }

    if (Array.isArray(req.body.tenthInformation)) {
      student.tenthInformation = normalizeEducationArray(req.body.tenthInformation);
    }

    if (Array.isArray(req.body.twelfthInformation)) {
      student.twelfthInformation = normalizeEducationArray(req.body.twelfthInformation);
    }

    if (Array.isArray(req.body.graduationInformation)) {
      student.graduationInformation = normalizeEducationArray(req.body.graduationInformation);
    }

    if (Array.isArray(req.body.postGraduationInformation)) {
      student.postGraduationInformation = normalizeEducationArray(req.body.postGraduationInformation);
    }

    if (Array.isArray(req.body.employmentInformation)) {
      student.employmentInformation = normalizeEmploymentArray(req.body.employmentInformation);
    }

    if (Array.isArray(req.body.preferredRegionAndCollege)) {
      student.preferredRegionAndCollege = normalizePreferredRegionArray(req.body.preferredRegionAndCollege);
    }

    await student.save();

    return res.json({
      message: 'Student updated successfully.',
      student
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    const mailCheck = normalizeText(req.body.emailId || req.body.email);
    if (mailCheck && normalizeText(student.emailId).toLowerCase() !== mailCheck.toLowerCase()) {
      return res.status(400).json({ error: 'Email mismatch. Provide the student email to confirm deletion.' });
    }

    await Student.deleteOne({ _id: student._id });
    return res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const addPreference = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    const universityName = normalizeText(req.body.universityName);
    if (!universityName) {
      return res.status(400).json({ error: 'universityName is required.' });
    }

    const preferencePayload = normalizePreferenceObject(req.body);
    student.universitiesPreferences.push(preferencePayload);

    await student.save();

    return res.status(201).json({
      message: 'University preference added successfully.',
      preference: student.universitiesPreferences[student.universitiesPreferences.length - 1]
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    return res.json(student.universitiesPreferences);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePreference = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    const preferenceId = req.params.preferenceId;
    const preferenceIndex = student.universitiesPreferences.findIndex(
      (pref) => String(pref._id) === String(preferenceId)
    );

    if (preferenceIndex === -1) {
      return res.status(404).json({ error: 'Preference not found.' });
    }

    const existingPreference = student.universitiesPreferences[preferenceIndex];
    const updatedPreference = normalizePreferenceObject({
      ...existingPreference.toObject?.() || existingPreference,
      ...req.body
    });

    updatedPreference.updatedAt = new Date();
    student.universitiesPreferences[preferenceIndex] = updatedPreference;

    await student.save();

    return res.json({
      message: 'Preference updated successfully.',
      preference: student.universitiesPreferences[preferenceIndex]
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deletePreference = async (req, res) => {
  try {
    const { student, error } = await getStudentByAccess(req.params.studentId, req.user);
    if (error) {
      return res.status(error.code).json({ error: error.message });
    }

    const preferenceId = req.params.preferenceId;
    const preferenceIndex = student.universitiesPreferences.findIndex(
      (pref) => String(pref._id) === String(preferenceId)
    );

    if (preferenceIndex === -1) {
      return res.status(404).json({ error: 'Preference not found.' });
    }

    student.universitiesPreferences.splice(preferenceIndex, 1);

    await student.save();

    return res.json({ message: 'Preference deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};