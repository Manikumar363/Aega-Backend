import mongoose from 'mongoose';
import AuditCategory from '../models/auditCategory.js';

const normalizeText = (value) => String(value || '').trim();

// POST: Create Audit Category
export const createCategory = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const description = normalizeText(req.body.description);
    const target = normalizeText(req.body.target).toLowerCase();

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required.'
      });
    }

    if (!['agent', 'university'].includes(target)) {
      return res.status(400).json({
        success: false,
        message: 'Target must be either "agent" or "university".'
      });
    }

    // Check if category with same name and target exists (case-insensitive)
    const existing = await AuditCategory.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
      target
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An audit category with the name "${name}" already exists for ${target}s.`
      });
    }

    const category = new AuditCategory({
      name,
      description,
      target,
      createdBy: req.user.id
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: 'Audit category created successfully.',
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating audit category.',
      error: error.message
    });
  }
};

// GET: Get Audit Categories (optionally filter by target)
export const getCategories = async (req, res) => {
  try {
    const { target } = req.query;
    const filter = {};

    if (target) {
      const normalizedTarget = normalizeText(target).toLowerCase();
      if (['agent', 'university'].includes(normalizedTarget)) {
        filter.target = normalizedTarget;
      }
    }

    const categories = await AuditCategory.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role')
      .lean();

    return res.status(200).json({
      success: true,
      data: categories,
      message: 'Audit categories fetched successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching audit categories.',
      error: error.message
    });
  }
};

// GET: Get Specific Audit Category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { auditId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit category ID format. Must be a 24-character hex string.'
      });
    }

    const category = await AuditCategory.findById(auditId)
      .populate('createdBy', 'name email role');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
      message: 'Audit category details fetched successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching audit category details.',
      error: error.message
    });
  }
};

// PUT: Update Audit Category
export const updateCategory = async (req, res) => {
  try {
    const { auditId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit category ID format. Must be a 24-character hex string.'
      });
    }

    const category = await AuditCategory.findById(auditId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    const name = req.body.name !== undefined ? normalizeText(req.body.name) : undefined;
    const description = req.body.description !== undefined ? normalizeText(req.body.description) : undefined;
    const target = req.body.target !== undefined ? normalizeText(req.body.target).toLowerCase() : undefined;

    if (name === '') {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }
    if (description === '') {
      return res.status(400).json({ success: false, message: 'Description cannot be empty.' });
    }
    if (target !== undefined && !['agent', 'university'].includes(target)) {
      return res.status(400).json({ success: false, message: 'Target must be either "agent" or "university".' });
    }

    // If changing name or target, check for duplicate name
    const finalName = name !== undefined ? name : category.name;
    const finalTarget = target !== undefined ? target : category.target;

    if (name !== undefined || target !== undefined) {
      const existing = await AuditCategory.findOne({
        name: { $regex: new RegExp(`^${finalName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
        target: finalTarget,
        _id: { $ne: category._id }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `An audit category with the name "${finalName}" already exists for ${finalTarget}s.`
        });
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (target !== undefined) category.target = target;

    category.updatedAt = new Date();
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Audit category updated successfully.',
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating audit category.',
      error: error.message
    });
  }
};

// DELETE: Delete Audit Category
export const deleteCategory = async (req, res) => {
  try {
    const { auditId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit category ID format. Must be a 24-character hex string.'
      });
    }

    const result = await AuditCategory.deleteOne({ _id: auditId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Audit category deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting audit category.',
      error: error.message
    });
  }
};

// POST: Add Audit Criterion under a Category
export const addCriterion = async (req, res) => {
  try {
    const { auditId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit category ID format. Must be a 24-character hex string.'
      });
    }
    const criterion = normalizeText(req.body.criterion || req.body.auditCriterion);
    const evidence = normalizeText(req.body.evidence);

    if (!criterion || !evidence) {
      return res.status(400).json({
        success: false,
        message: 'Criterion and evidence are required.'
      });
    }

    const category = await AuditCategory.findById(auditId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    // Avoid exact duplicate criterion within the same category
    const isDuplicate = category.criteria.some(
      (c) => c.criterion.toLowerCase() === criterion.toLowerCase()
    );

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'This audit criterion already exists in this category.'
      });
    }

    const severity = req.body.severity !== undefined ? normalizeText(req.body.severity).toLowerCase() : 'low';
    if (severity && !['low', 'medium', 'high'].includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Severity must be low, medium, or high.'
      });
    }

    category.criteria.push({ criterion, evidence, severity });
    category.updatedAt = new Date();
    await category.save();

    // Get the newly added criterion subdocument
    const addedCriterion = category.criteria[category.criteria.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Audit criterion added successfully.',
      data: addedCriterion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error adding audit criterion.',
      error: error.message
    });
  }
};

// PUT: Update Audit Criterion under a Category
export const updateCriterion = async (req, res) => {
  try {
    const { auditId, criterionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit category ID format. Must be a 24-character hex string.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(criterionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid criterion ID format. Must be a 24-character hex string.'
      });
    }
    const criterion = req.body.criterion !== undefined ? normalizeText(req.body.criterion || req.body.auditCriterion) : undefined;
    const evidence = req.body.evidence !== undefined ? normalizeText(req.body.evidence) : undefined;

    if (criterion === '') {
      return res.status(400).json({ success: false, message: 'Criterion cannot be empty.' });
    }
    if (evidence === '') {
      return res.status(400).json({ success: false, message: 'Evidence cannot be empty.' });
    }

    const category = await AuditCategory.findById(auditId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    const subdoc = category.criteria.id(criterionId);
    if (!subdoc) {
      return res.status(404).json({
        success: false,
        message: 'Audit criterion not found.'
      });
    }

    // Check if new criterion name duplicates an existing one (other than itself)
    if (criterion !== undefined) {
      const isDuplicate = category.criteria.some(
        (c) => String(c._id) !== String(criterionId) && c.criterion.toLowerCase() === criterion.toLowerCase()
      );

      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another audit criterion with this name already exists in this category.'
        });
      }
      subdoc.criterion = criterion;
    }

    const severity = req.body.severity !== undefined ? normalizeText(req.body.severity).toLowerCase() : undefined;
    if (severity !== undefined && !['low', 'medium', 'high'].includes(severity)) {
      return res.status(400).json({ success: false, message: 'Severity must be low, medium, or high.' });
    }

    if (evidence !== undefined) {
      subdoc.evidence = evidence;
    }
    if (severity !== undefined) {
      subdoc.severity = severity;
    }

    category.updatedAt = new Date();
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Audit criterion updated successfully.',
      data: subdoc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating audit criterion.',
      error: error.message
    });
  }
};

// DELETE: Delete Audit Criterion under a Category
export const deleteCriterion = async (req, res) => {
  try {
    const { auditId, criterionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit category ID format. Must be a 24-character hex string.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(criterionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid criterion ID format. Must be a 24-character hex string.'
      });
    }

    const category = await AuditCategory.findById(auditId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    const subdoc = category.criteria.id(criterionId);
    if (!subdoc) {
      return res.status(404).json({
        success: false,
        message: 'Audit criterion not found.'
      });
    }

    category.criteria.pull({ _id: criterionId });
    category.updatedAt = new Date();
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Audit criterion deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting audit criterion.',
      error: error.message
    });
  }
};
