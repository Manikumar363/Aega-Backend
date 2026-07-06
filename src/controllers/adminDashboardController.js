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
