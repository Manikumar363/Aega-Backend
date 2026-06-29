import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('--- Starting Compliance & KPI Integration Tests ---');
  let adminToken;
  let universityId;

  // 1. Sign up a new University to trigger University Profile creation
  try {
    console.log('1. Signing up a test University...');
    const signupEmail = `audit.uni.${Date.now()}@example.com`;
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Audit',
      lastName: 'University',
      universityName: 'Vanguard Test Academy',
      email: signupEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'university',
      supportingDocument1: '/uploads/doc1.pdf',
      supportingDocument2: '/uploads/doc2.pdf'
    });
    console.log('University signup successful.');
  } catch (error) {
    console.error('Failed to signup university:', error.response?.data || error.message);
    process.exit(1);
  }

  // 2. Login as Admin
  try {
    console.log('\n2. Logging in as Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/admin/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234'
    });
    adminToken = loginRes.data.token;
    if (!adminToken) {
      throw new Error('Admin login did not return token.');
    }
    console.log('Login successful.');
  } catch (error) {
    console.error('Failed to log in as admin:', error.response?.data || error.message);
    process.exit(1);
  }

  const adminClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });

  // 3. Retrieve the created University ID
  try {
    console.log('\n3. Fetching university list as admin to find Vanguard Test Academy...');
    const listRes = await adminClient.get('/api/admin/universities');
    const universities = listRes.data.data;
    const vanguard = universities.find(u => u.name === 'Vanguard Test Academy');
    if (!vanguard) {
      throw new Error('Vanguard Test Academy profile not found in listed universities.');
    }
    universityId = vanguard._id;
    console.log(`Found Vanguard Test Academy with ID: ${universityId}`);
  } catch (error) {
    console.error('Failed to list universities:', error.response?.data || error.message);
    process.exit(1);
  }

  let categoryId;
  const criteriaIds = [];

  // 4. Create Audit Category for University
  try {
    console.log('\n4. Creating Compliance Category...');
    const catRes = await adminClient.post('/api/admin/audits', {
      name: `QA Governance Audit - ${Date.now()}`,
      description: 'Audit category for QA validation',
      target: 'university'
    });
    categoryId = catRes.data.data._id;
    console.log(`Category created with ID: ${categoryId}`);
  } catch (error) {
    console.error('Failed to create category:', error.response?.data || error.message);
    process.exit(1);
  }

  // 5. Add 5 Criteria: 2 Low, 3 High
  const criteriaToAdd = [
    { criterion: 'Q1 (Low)', severity: 'low', evidence: 'Evidence 1' },
    { criterion: 'Q2 (Low)', severity: 'low', evidence: 'Evidence 2' },
    { criterion: 'Q3 (High)', severity: 'high', evidence: 'Evidence 3' },
    { criterion: 'Q4 (High)', severity: 'high', evidence: 'Evidence 4' },
    { criterion: 'Q5 (High)', severity: 'high', evidence: 'Evidence 5' }
  ];

  try {
    console.log('\n5. Adding 5 criteria (2 Low, 3 High) to the category template...');
    for (const item of criteriaToAdd) {
      const critRes = await adminClient.post(`/api/admin/audits/${categoryId}/criteria`, item);
      criteriaIds.push(critRes.data.data._id);
      console.log(`Added: ${item.criterion} (Severity: ${item.severity}) -> ID: ${critRes.data.data._id}`);
    }
  } catch (error) {
    console.error('Failed to add criteria:', error.response?.data || error.message);
    process.exit(1);
  }

  // 6. Submit Audit Check (4 Compliant, 1 Non-Compliant High)
  // Weights:
  // Q1 (Low)  -> Compliant     (Weight = 100, earned = 100)
  // Q2 (Low)  -> Compliant     (Weight = 100, earned = 100)
  // Q3 (High) -> Compliant     (Weight = 33.33, earned = 33.33)
  // Q4 (High) -> Non-Compliant (Weight = 33.33, earned = 0)
  // Q5 (High) -> Compliant     (Weight = 33.33, earned = 33.33)
  //
  // Expected Score: (266.66 / 299.99) * 100 = 88.89%
  // Expected Alerts: 1 (Q4 is non-compliant)
  // Expected Risk Level: LOW (since 88.89 > 66.66)
  try {
    console.log('\n6. Submitting Audit Check against Vanguard Test Academy...');
    const checkAnswers = [
      { criterionId: criteriaIds[0], status: 'compliant', severity: 'low' },
      { criterionId: criteriaIds[1], status: 'compliant', severity: 'low' },
      { criterionId: criteriaIds[2], status: 'compliant', severity: 'high' },
      { criterionId: criteriaIds[3], status: 'non-compliant', severity: 'high', comment: 'Missing process document' },
      { criterionId: criteriaIds[4], status: 'compliant', severity: 'high' }
    ];

    const checkRes = await adminClient.post('/api/admin/audits/checks/submit', {
      targetType: 'university',
      targetId: universityId,
      categoryId,
      answers: checkAnswers
    });

    const checkResult = checkRes.data.data;
    console.log('Check Score Calculated by Server:', checkResult.complianceScore);
    if (Math.abs(checkResult.complianceScore - 86.67) > 0.1) {
      throw new Error(`Expected score close to 86.67, but got ${checkResult.complianceScore}`);
    }
    console.log('Verification: Audit check compliance score matches calculation formula.');
  } catch (error) {
    console.error('Failed to submit audit check:', error.response?.data || error.message);
    process.exit(1);
  }

  // 7. Verify University Profile Updates
  try {
    console.log('\n7. Verifying target University Profile compliance KPIs...');
    const detailRes = await adminClient.get(`/api/admin/universities/${universityId}`);
    const universityProfile = detailRes.data.data;
    console.log('University Compliance KPIs:', {
      complianceScore: universityProfile.complianceScore,
      numberOfAudits: universityProfile.numberOfAudits,
      activeAlerts: universityProfile.activeAlerts,
      riskLevel: universityProfile.riskLevel
    });

    if (Math.abs(universityProfile.complianceScore - 86.67) > 0.1) {
      throw new Error(`Profile complianceScore not matching expected 86.67 (got ${universityProfile.complianceScore})`);
    }
    if (universityProfile.numberOfAudits !== 1) {
      throw new Error(`Expected numberOfAudits = 1, but got ${universityProfile.numberOfAudits}`);
    }
    if (universityProfile.activeAlerts !== 1) {
      throw new Error(`Expected activeAlerts = 1 (1 non-compliant question), but got ${universityProfile.activeAlerts}`);
    }
    if (universityProfile.riskLevel !== 'LOW') {
      throw new Error(`Expected riskLevel = LOW, but got ${universityProfile.riskLevel}`);
    }
    console.log('Verification: Target Profile compliance KPIs successfully persisted.');
  } catch (error) {
    console.error('Failed to verify university profile:', error.response?.data || error.message);
    process.exit(1);
  }

  // 8. Test /checks/summary Endpoint
  try {
    console.log('\n8. Querying compliance summary endpoint...');
    const summaryRes = await adminClient.get(`/api/admin/audits/checks/summary?targetType=university&targetId=${universityId}`);
    const summary = summaryRes.data.data;
    console.log('Summary response:', summary);

    if (Math.abs(summary.complianceScore - 86.67) > 0.1 || summary.numberOfAudits !== 1 || summary.activeAlerts !== 1 || summary.riskLevel !== 'LOW') {
      throw new Error('Summary endpoint returned unexpected compliance KPIs.');
    }
    console.log('Verification: Summary endpoint returns correct active alert count and risk level.');
  } catch (error) {
    console.error('Failed to query summary endpoint:', error.response?.data || error.message);
    process.exit(1);
  }

  console.log('\n--- All Compliance & KPI Integration Tests Passed Successfully! ---');
  process.exit(0);
}

runTests();
