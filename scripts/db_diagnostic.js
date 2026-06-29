import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AgentProfile from '../src/models/agentProfile.js';
import EntityAudit from '../src/models/entityAudit.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aega';

async function diagnose() {
  console.log('Connecting to database:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const agentId = '69ea4e88d6622abf7de9f501';

  console.log('\n--- Searching for AgentProfile by ID:', agentId);
  const profile = await AgentProfile.findById(agentId).lean();
  if (profile) {
    console.log('Profile found:', JSON.stringify(profile, null, 2));
  } else {
    console.log('Profile not found by ID!');
  }

  console.log('\n--- Searching for AgentProfile by email "peter.team@gmail.com":');
  const profilesByEmail = await AgentProfile.find({ emailId: 'peter.team@gmail.com' }).lean();
  console.log(`Found ${profilesByEmail.length} profiles by email:`);
  profilesByEmail.forEach(p => {
    console.log(JSON.stringify(p, null, 2));
  });

  console.log('\n--- Searching for EntityAudits for targetId:', agentId);
  const audits = await EntityAudit.find({ targetId: agentId }).lean();
  console.log(`Found ${audits.length} audits:`);
  audits.forEach(a => {
    console.log(JSON.stringify(a, null, 2));
  });

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
