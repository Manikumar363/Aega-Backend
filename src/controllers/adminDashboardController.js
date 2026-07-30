import User from '../models/user.js';
import AgentProfile from '../models/agentProfile.js';
import University from '../models/university.js';
import Company from '../models/company.js';
import Student from '../models/student.js';
import Complaint from '../models/complaint.js';
import EntityAudit from '../models/entityAudit.js';

export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeAgents = await AgentProfile.countDocuments();
    const totalUniversities = await University.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const totalAudits = await EntityAudit.countDocuments();

    // Fetch the latest 5 registered users as recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name firstName lastName email role createdAt');

    const recentActivity = recentUsers.map((u) => {
      const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
      return {
        user: name,
        action: `Registered as a new ${u.role || 'user'}`,
        time: u.createdAt
      };
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeAgents,
        totalUniversities,
        totalCompanies,
        totalStudents,
        totalComplaints,
        totalAudits,
        recentActivity
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard stats',
      error: error.message
    });
  }
};

export const searchEverything = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ success: true, data: { agents: [], universities: [], companies: [], students: [] } });
  }

  try {
    const query = q.trim();
    const regex = new RegExp(query, 'i');

    const agents = await User.find({
      role: 'agent',
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex }
      ]
    }).limit(10).select('firstName lastName email country office mobileNumber designation');

    const universities = await User.find({
      role: 'university',
      $or: [
        { universityName: regex },
        { email: regex }
      ]
    }).limit(10).select('universityName email country city');

    const companies = await Company.find({
      $or: [
        { companyName: regex },
        { emailId: regex },
        { founderName: regex }
      ]
    }).limit(10).select('companyName founderName emailId mobileNumber country office');

    const students = await Student.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { emailId: regex }
      ]
    }).limit(10).select('firstName lastName emailId mobileNumber preferredRegionAndCollege');

    return res.json({
      success: true,
      data: {
        agents,
        universities,
        companies,
        students
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Search failed', error: err.message });
  }
};
