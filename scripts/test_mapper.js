import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AgentProfile from '../src/models/agentProfile.js';
import User from '../src/models/user.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aega';

const buildAgentResponse = (profile, user) => ({
  id: profile._id,
  userId: user?._id || profile.userId,
  firstName: profile.firstName,
  lastName: profile.lastName,
  emailId: profile.emailId,
  mobileNumber: profile.mobileNumber,
  designation: profile.designation,
  office: profile.office,
  country: profile.country,
  authorization: profile.authorization,
  complianceScore: profile.complianceScore !== undefined ? profile.complianceScore : 100,
  numberOfAudits: profile.numberOfAudits !== undefined ? profile.numberOfAudits : 0,
  activeAlerts: profile.activeAlerts !== undefined ? profile.activeAlerts : 0,
  riskLevel: profile.riskLevel || 'LOW',
  createdAt: profile.createdAt,
  user: user
    ? {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    : null
});

async function run() {
  await mongoose.connect(MONGO_URI);

  const agentId = '69ea4e88d6622abf7de9f501';
  const profile = await AgentProfile.findById(agentId);
  if (!profile) {
    console.log('Profile not found.');
    await mongoose.disconnect();
    return;
  }

  const user = await User.findById(profile.userId);
  const mapped = buildAgentResponse(profile, user);
  console.log('Mapped output:');
  console.log(JSON.stringify(mapped, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
