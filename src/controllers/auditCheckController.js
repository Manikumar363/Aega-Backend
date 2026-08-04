import mongoose from 'mongoose';
import EntityAudit from '../models/entityAudit.js';
import AuditCategory from '../models/auditCategory.js';
import AgentProfile from '../models/agentProfile.js';
import Company from '../models/company.js';
import University from '../models/university.js';
import User from '../models/user.js';

const SEVERITY_WEIGHTS = {
  low: 100,
  medium: 66.66,
  high: 33.33
};

const mapSeverityToWeight = (severity) => {
  const normalized = String(severity || '').toLowerCase().trim();
  return SEVERITY_WEIGHTS[normalized] || SEVERITY_WEIGHTS.low;
};

// Recalculates and updates compliance metrics on the target entity document
const updateTargetEntityKPIs = async (targetType, targetId, newAuditScore) => {
  // 1. Get total number of audits completed for this target
  const numberOfAudits = await EntityAudit.countDocuments({ targetType, targetId });

  // 2. Fetch all audits to compute score/alerts based on the latest check per category
  const allAudits = await EntityAudit.find({ targetType, targetId }).lean();
  
  const latestByCategory = {};
  allAudits.forEach(audit => {
    const catIdStr = String(audit.categoryId);
    if (!latestByCategory[catIdStr] || latestByCategory[catIdStr].createdAt < audit.createdAt) {
      latestByCategory[catIdStr] = audit;
    }
  });

  const latestAudits = Object.values(latestByCategory);

  // 3. Compute overall compliance score
  let overallScore = 100;

  // Retrieve the profile's current complianceScore before updating
  let targetProfile = null;
  if (mongoose.Types.ObjectId.isValid(targetId)) {
    if (targetType === 'agent') {
      targetProfile = (await AgentProfile.findById(targetId).select('complianceScore')) ||
                      (await AgentProfile.findOne({ userId: targetId }).select('complianceScore')) ||
                      (await User.findById(targetId).select('complianceScore'));
    } else if (targetType === 'company') {
      targetProfile = (await Company.findById(targetId).select('complianceScore')) ||
                      (await User.findById(targetId).select('complianceScore')) ||
                      (await AgentProfile.findById(targetId).select('complianceScore'));
    } else if (targetType === 'university') {
      targetProfile = (await University.findById(targetId).select('complianceScore')) ||
                      (await User.findById(targetId).select('complianceScore'));
    }
  }

  if (newAuditScore !== undefined && newAuditScore !== null) {
    if (numberOfAudits > 1 && targetProfile && targetProfile.complianceScore !== undefined && targetProfile.complianceScore !== null) {
      overallScore = Math.round(((targetProfile.complianceScore + newAuditScore) / 2) * 100) / 100;
    } else {
      overallScore = newAuditScore;
    }
  } else {
    // Fallback if no newAuditScore is provided
    const sumScore = latestAudits.reduce((acc, a) => acc + a.complianceScore, 0);
    overallScore = latestAudits.length > 0 
      ? Math.round((sumScore / latestAudits.length) * 100) / 100 
      : 100;
  }

  // 4. Compute active alerts (count of non-compliant questions in latest check per category)
  let activeAlerts = 0;
  latestAudits.forEach(audit => {
    (audit.answers || []).forEach(ans => {
      if (ans.status === 'non-compliant') {
        activeAlerts += 1;
      }
    });
  });

  // 5. Determine Risk Level
  let riskLevel = 'LOW';
  if (overallScore < 33.33) {
    riskLevel = 'HIGH';
  } else if (overallScore >= 33.33 && overallScore <= 66.66) {
    riskLevel = 'MEDIUM';
  }

  // 6. Persist KPIs to the corresponding target model
  const updatePayload = {
    complianceScore: overallScore,
    numberOfAudits,
    activeAlerts,
    riskLevel
  };

  if (mongoose.Types.ObjectId.isValid(targetId)) {
    if (targetType === 'agent') {
      const p = await AgentProfile.exists({ _id: targetId });
      if (p) {
        await AgentProfile.updateOne({ _id: targetId }, updatePayload);
      } else {
        await User.updateOne({ _id: targetId }, updatePayload);
      }
    } else if (targetType === 'company') {
      const c = await Company.exists({ _id: targetId });
      if (c) {
        await Company.updateOne({ _id: targetId }, updatePayload);
      } else {
        await User.updateOne({ _id: targetId }, updatePayload);
        await AgentProfile.updateOne({ _id: targetId }, updatePayload);
      }
    } else if (targetType === 'university') {
      const u = await University.exists({ _id: targetId });
      if (u) {
        await University.updateOne({ _id: targetId }, updatePayload);
      } else {
        await User.updateOne({ _id: targetId }, updatePayload);
      }
    }
  }

  return updatePayload;
};

// POST: Submit an Audit Check
export const submitAuditCheck = async (req, res) => {
  try {
    const { targetType, targetId, categoryId, answers } = req.body;

    if (!targetType || !targetId || !categoryId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'targetType, targetId, categoryId, and answers array are required.'
      });
    }

    if (!['agent', 'company', 'university'].includes(targetType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'targetType must be one of: "agent", "company", "university".'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid categoryId format. Must be a 24-character hex string.'
      });
    }

    // Validate criterionId in all answers
    for (const ans of answers) {
      if (!ans.criterionId || !mongoose.Types.ObjectId.isValid(ans.criterionId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid or missing criterionId: "${ans ? ans.criterionId : ''}".`
        });
      }
    }

    // Verify Target Entity Exists (only if targetId is a valid ObjectId)
    let targetExists = true;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetExists = false;
      if (targetType === 'agent') {
        targetExists = Boolean(
          (await AgentProfile.exists({ _id: targetId })) ||
          (await AgentProfile.exists({ userId: targetId })) ||
          (await User.exists({ _id: targetId }))
        );
      } else if (targetType === 'company') {
        targetExists = Boolean(
          (await Company.exists({ _id: targetId })) ||
          (await User.exists({ _id: targetId })) ||
          (await AgentProfile.exists({ _id: targetId }))
        );
      } else if (targetType === 'university') {
        targetExists = Boolean(
          (await University.exists({ _id: targetId })) ||
          (await User.exists({ _id: targetId }))
        );
      }
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        message: `Target entity of type "${targetType}" with ID "${targetId}" not found.`
      });
    }

    // Verify Category Exists
    const category = await AuditCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Audit category not found.'
      });
    }

    // Map answers and calculate score
    let sumScores = 0;

    const processedAnswers = answers.map((ans) => {
      const criterion = category.criteria.id(ans.criterionId);
      if (!criterion) {
        throw new Error(`Criterion with ID "${ans.criterionId}" does not exist in category "${category.name}".`);
      }

      const severity = ans.severity || criterion.severity || 'low';
      const normalizedSeverity = String(severity).toLowerCase().trim();

      const ansStatus = String(ans.status || 'compliant').toLowerCase().trim();
      let levelScore = 100;
      let finalStatus = 'compliant';

      if (ansStatus === 'non-compliant') {
        finalStatus = 'non-compliant';
        if (normalizedSeverity === 'high') {
          levelScore = 33.33;
        } else {
          levelScore = 66.66;
        }
      }

      sumScores += levelScore;

      return {
        criterionId: ans.criterionId,
        criterion: criterion.criterion,
        evidence: criterion.evidence,
        severity: normalizedSeverity,
        status: finalStatus,
        comment: ans.comment ? String(ans.comment).trim() : null
      };
    });

    const complianceScore = processedAnswers.length > 0
      ? Math.round((sumScores / processedAnswers.length) * 100) / 100
      : 100;

    // Keep historical audits and disable deletion to allow audit counts to accumulate
    // await EntityAudit.deleteMany({ targetType, targetId, categoryId });

    const auditCheck = new EntityAudit({
      targetType,
      targetId,
      categoryId,
      categoryName: category.name,
      answers: processedAnswers,
      complianceScore,
      auditedBy: req.user.id
    });

    await auditCheck.save();

    // Trigger KPI recalculation for the target profile, passing the newly completed audit's score
    const newKPIs = await updateTargetEntityKPIs(targetType, targetId, complianceScore);

    return res.status(201).json({
      success: true,
      message: 'Audit check submitted successfully.',
      data: auditCheck,
      overallKPIs: newKPIs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error submitting audit check.',
      error: error.message
    });
  }
};

// GET: Fetch Audit Checks for a specific entity
export const getAuditChecks = async (req, res) => {
  try {
    let resolvedTargetType = req.query.targetType;
    let resolvedTargetId = req.query.targetId;

    if (!resolvedTargetType || !resolvedTargetId) {
      if (req.user && (req.user.role === 'agent' || req.user.role === 'counsellor')) {
        resolvedTargetType = 'agent';
        const profile = await AgentProfile.findOne({ userId: req.user.id });
        if (!profile) {
          return res.status(404).json({ success: false, message: 'Agent profile not found.' });
        }
        resolvedTargetId = profile._id;
      } else if (req.user && req.user.role === 'university') {
        resolvedTargetType = 'university';
        const university = await University.findOne({ userId: req.user.id });
        if (!university) {
          return res.status(404).json({ success: false, message: 'University profile not found.' });
        }
        resolvedTargetId = university._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'targetType and targetId query parameters are required.'
        });
      }
    }

    const checks = await EntityAudit.find({ targetType: resolvedTargetType, targetId: resolvedTargetId })
      .sort({ createdAt: -1 })
      .populate('auditedBy', 'name email role')
      .lean();

    // Return all audit checks (full chronological history)
    return res.status(200).json({
      success: true,
      data: checks,
      message: 'Audit checks fetched successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching audit checks.',
      error: error.message
    });
  }
};

// GET: Fetch Specific Audit Check by ID
export const getAuditCheckById = async (req, res) => {
  try {
    const { checkId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(checkId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checkId format. Must be a 24-character hex string.'
      });
    }

    const check = await EntityAudit.findById(checkId)
      .populate('auditedBy', 'name email role');

    if (!check) {
      return res.status(404).json({
        success: false,
        message: 'Audit check not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: check
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching audit check.',
      error: error.message
    });
  }
};

// GET: Get Entity Audit Summary KPIs
export const getEntityAuditSummary = async (req, res) => {
  try {
    let resolvedTargetType = req.query.targetType;
    let resolvedTargetId = req.query.targetId;

    if (!resolvedTargetType || !resolvedTargetId) {
      if (req.user && (req.user.role === 'agent' || req.user.role === 'counsellor')) {
        resolvedTargetType = 'agent';
        const profile = await AgentProfile.findOne({ userId: req.user.id });
        if (!profile) {
          return res.status(404).json({ success: false, message: 'Agent profile not found.' });
        }
        resolvedTargetId = profile._id;
      } else if (req.user && req.user.role === 'university') {
        resolvedTargetType = 'university';
        const university = await University.findOne({ userId: req.user.id });
        if (!university) {
          return res.status(404).json({ success: false, message: 'University profile not found.' });
        }
        resolvedTargetId = university._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'targetType and targetId query parameters are required.'
        });
      }
    }

    // Attempt to read from the profile document directly for fast performance (only if resolvedTargetId is a valid ObjectId)
    let profile = null;
    if (mongoose.Types.ObjectId.isValid(resolvedTargetId)) {
      if (resolvedTargetType === 'agent') {
        profile = await AgentProfile.findById(resolvedTargetId).select('complianceScore numberOfAudits activeAlerts riskLevel');
      } else if (resolvedTargetType === 'company') {
        profile = await Company.findById(resolvedTargetId).select('complianceScore numberOfAudits activeAlerts riskLevel');
      } else if (resolvedTargetType === 'university') {
        profile = await University.findById(resolvedTargetId).select('complianceScore numberOfAudits activeAlerts riskLevel');
      }
    }

    if (!profile) {
      // If profile document does not exist or is a mock target, compute dynamically from EntityAudit checks
      const allAudits = await EntityAudit.find({ targetType: resolvedTargetType, targetId: resolvedTargetId }).lean();
      
      const latestByCategory = {};
      allAudits.forEach(audit => {
        const catIdStr = String(audit.categoryId);
        if (!latestByCategory[catIdStr] || latestByCategory[catIdStr].createdAt < audit.createdAt) {
          latestByCategory[catIdStr] = audit;
        }
      });

      const latestAudits = Object.values(latestByCategory);
      const sumScore = latestAudits.reduce((acc, a) => acc + a.complianceScore, 0);
      const overallScore = latestAudits.length > 0 
        ? Math.round((sumScore / latestAudits.length) * 100) / 100 
        : 100;

      let activeAlerts = 0;
      latestAudits.forEach(audit => {
        (audit.answers || []).forEach(ans => {
          if (ans.status === 'non-compliant') {
            activeAlerts += 1;
          }
        });
      });

      let riskLevel = 'LOW';
      if (overallScore < 33.33) {
        riskLevel = 'HIGH';
      } else if (overallScore >= 33.33 && overallScore <= 66.66) {
        riskLevel = 'MEDIUM';
      }

      return res.status(200).json({
        success: true,
        data: {
          complianceScore: overallScore,
          numberOfAudits: allAudits.length,
          activeAlerts,
          riskLevel
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        complianceScore: profile.complianceScore ?? 100,
        numberOfAudits: profile.numberOfAudits ?? 0,
        activeAlerts: profile.activeAlerts ?? 0,
        riskLevel: profile.riskLevel ?? 'LOW'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching audit summary.',
      error: error.message
    });
  }
};

// GET: Get Entity Compliance Summary KPIs (specifically for the Compliances Tab)
export const getEntityComplianceSummary = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetType and targetId query parameters are required.'
      });
    }

    // Check if any audits done
    const auditsCount = await EntityAudit.countDocuments({ targetType, targetId });
    if (auditsCount === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overallScore: null,
          activeIssues: 0,
          riskLevel: 'N/A'
        }
      });
    }

    let complianceScore = 100;
    let activeAlerts = 0;
    let riskLevel = 'LOW';

    if (mongoose.Types.ObjectId.isValid(targetId)) {
      let profile = null;
      if (targetType === 'agent') {
        profile = await AgentProfile.findById(targetId).select('complianceScore activeAlerts riskLevel');
      } else if (targetType === 'company') {
        profile = await Company.findById(targetId).select('complianceScore activeAlerts riskLevel');
      } else if (targetType === 'university') {
        profile = await University.findById(targetId).select('complianceScore activeAlerts riskLevel');
      }

      if (profile) {
        complianceScore = profile.complianceScore ?? 100;
        activeAlerts = profile.activeAlerts ?? 0;
        riskLevel = profile.riskLevel ?? 'LOW';
      }
    } else {
      // For mock ID (e.g. "1"), dynamically compute from EntityAudit checks
      const allAudits = await EntityAudit.find({ targetType, targetId }).lean();
      
      const latestByCategory = {};
      allAudits.forEach(audit => {
        const catIdStr = String(audit.categoryId);
        if (!latestByCategory[catIdStr] || latestByCategory[catIdStr].createdAt < audit.createdAt) {
          latestByCategory[catIdStr] = audit;
        }
      });

      const latestAudits = Object.values(latestByCategory);
      const sumScore = latestAudits.reduce((acc, a) => acc + a.complianceScore, 0);
      complianceScore = latestAudits.length > 0 
        ? Math.round((sumScore / latestAudits.length) * 100) / 100 
        : 100;

      latestAudits.forEach(audit => {
        (audit.answers || []).forEach(ans => {
          if (ans.status === 'non-compliant') {
            activeAlerts += 1;
          }
        });
      });

      if (complianceScore < 33.33) {
        riskLevel = 'HIGH';
      } else if (complianceScore >= 33.33 && complianceScore <= 66.66) {
        riskLevel = 'MEDIUM';
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        overallScore: complianceScore,
        activeIssues: activeAlerts,
        riskLevel
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

// GET: Fetch compliance status of each category for a target
export const getEntityComplianceStatus = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetType and targetId query parameters are required.'
      });
    }

    // 1. Get all categories template for this target
    const categoriesTarget = targetType === 'university' ? 'university' : 'agent';
    const categories = await AuditCategory.find({ target: categoriesTarget }).lean();

    // 2. Fetch all latest check evaluations for this target
    const checks = await EntityAudit.find({ targetType, targetId }).lean();
    if (checks.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    const checksByCategory = {};
    checks.forEach(check => {
      checksByCategory[String(check.categoryId)] = check;
    });

    // 3. Map categories to their compliance status: Compliant, Non-Compliant, or Pending
    const complianceList = categories.map((cat, index) => {
      const check = checksByCategory[String(cat._id)];
      let status = 'Pending';

      if (check) {
        // If there are any non-compliant answers, category is Non-Compliant
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
