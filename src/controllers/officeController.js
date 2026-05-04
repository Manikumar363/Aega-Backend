import Office from '../models/office.js';

const normalizeText = (v) => String(v || '').trim();

export const createOffice = async (req, res) => {
  try {
    const payload = {
      agentId: req.user.id,
      location: normalizeText(req.body.location),
      fullAddress: normalizeText(req.body.fullAddress),
      email: normalizeText(req.body.email),
      mobileNumber: normalizeText(req.body.mobileNumber)
    };

    const required = ['location', 'fullAddress', 'email', 'mobileNumber'].filter((k) => !payload[k]);
    if (required.length) {
      return res.status(400).json({ error: `Missing required fields: ${required.join(', ')}` });
    }

    const office = new Office(payload);
    await office.save();

    return res.status(201).json({ message: 'Office created successfully.', office });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getOffices = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin ? {} : { agentId: req.user.id };

    const offices = await Office.find(query).sort({ createdAt: -1 }).lean();
    return res.json(offices);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getOfficeById = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId).lean();
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    // Authorization: owner or admin
    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    return res.json(office);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateOffice = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId);
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    const { location, fullAddress, email, mobileNumber } = req.body;
    if (location) office.location = normalizeText(location);
    if (fullAddress) office.fullAddress = normalizeText(fullAddress);
    if (email) office.email = normalizeText(email);
    if (mobileNumber) office.mobileNumber = normalizeText(mobileNumber);

    office.updatedAt = new Date();
    await office.save();

    return res.json({ message: 'Office updated successfully.', office });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteOffice = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId);
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    await Office.deleteOne({ _id: office._id });
    return res.json({ message: 'Office deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Employees (nested subdocuments)
export const addEmployee = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId);
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    const payload = {
      name: normalizeText(req.body.name),
      designation: normalizeText(req.body.designation),
      email: normalizeText(req.body.email),
      mobileNumber: normalizeText(req.body.mobileNumber),
      imageUrl: normalizeText(req.body.imageUrl)
    };

    if (!payload.name) return res.status(400).json({ error: 'Employee name is required.' });

    office.employees.push(payload);
    office.updatedAt = new Date();
    await office.save();

    return res.status(201).json({ message: 'Employee added.', employee: office.employees[office.employees.length - 1] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId).lean();
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    return res.json(office.employees || []);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId).lean();
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    const emp = (office.employees || []).find((e) => String(e._id) === String(req.params.employeeId));
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    return res.json(emp);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId);
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    const empIndex = office.employees.findIndex((e) => String(e._id) === String(req.params.employeeId));
    if (empIndex === -1) return res.status(404).json({ error: 'Employee not found.' });

    const emp = office.employees[empIndex];
    const { name, designation, email, mobileNumber, imageUrl } = req.body;
    if (name) emp.name = normalizeText(name);
    if (designation) emp.designation = normalizeText(designation);
    if (email) emp.email = normalizeText(email);
    if (mobileNumber) emp.mobileNumber = normalizeText(mobileNumber);
    if (imageUrl) emp.imageUrl = normalizeText(imageUrl);

    emp.updatedAt = new Date();
    office.employees[empIndex] = emp;
    office.updatedAt = new Date();
    await office.save();

    return res.json({ message: 'Employee updated.', employee: emp });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const office = await Office.findById(req.params.officeId);
    if (!office) return res.status(404).json({ error: 'Office not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(office.agentId) === String(req.user.id);
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized.' });

    const empIndex = office.employees.findIndex((e) => String(e._id) === String(req.params.employeeId));
    if (empIndex === -1) return res.status(404).json({ error: 'Employee not found.' });

    office.employees.splice(empIndex, 1);
    office.updatedAt = new Date();
    await office.save();

    return res.json({ message: 'Employee deleted.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
